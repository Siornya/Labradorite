import organizeSchema from "../contracts/schemas/organize-memory.json" with { type: "json" };
import recallSchema from "../contracts/schemas/recall-memory.json" with { type: "json" };
import deleteSchema from "../contracts/schemas/delete-memory.json" with { type: "json" };
import type { OrganizeMemory } from "../contracts/generated/organize-memory.js";
import type { RecallMemory } from "../contracts/generated/recall-memory.js";
import type { DeleteMemory } from "../contracts/generated/delete-memory.js";
import Database from "better-sqlite3";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Ajv } from "ajv";
import schema from "../contracts/schemas/submit-material.json" with { type: "json" };
import type { SubmitMaterial } from "../contracts/generated/submit-material.js";
import { SystemClock, type Clock } from "../domain/clock.js";

const validator = new Ajv({ strict: true });
const validateOrganization = validator.compile<OrganizeMemory>(organizeSchema);
const validateRecall = validator.compile<RecallMemory>(recallSchema);
const validateDelete = validator.compile<DeleteMemory>(deleteSchema);
export interface Episode extends Omit<
	OrganizeMemory,
	"operation_id" | "base_seq" | "expected_revision" | "id"
> {
	id: string;
	revision: number;
	commit_seq: string;
	recorded_at: string;
	semantic_status: "model_proposed";
	stale?: boolean;
}
const validate = new Ajv({ strict: true }).compile<SubmitMaterial>(schema);
export class MaterialError extends Error {
	constructor(
		public readonly code:
			| "VALIDATION_ERROR"
			| "IDEMPOTENCY_CONFLICT"
			| "NOT_FOUND"
			| "REVISION_CONFLICT"
			| "STALE_BASIS"
			| "SOURCE_INVALID",
	) {
		super(code);
	}
}
export interface MemoryScope {
	space: string;
	character: string;
	world: string;
}
export interface Material {
	id: string;
	revision: 1;
	corrects?: string;
	commit_seq: string;
	received_at: string;
	space_id: string;
	character_id: string;
	world_id: string;
	text: string;
	source_kind: SubmitMaterial["source_kind"];
	speaker: string;
	coverage: string;
	authored_at: string | null;
	organization_status: "pending";
}
function canonical(value: unknown): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	return `{${Object.entries(value)
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
		.join(",")}}`;
}
function validTimestamp(value: string): boolean {
	const match =
		/^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
			value,
		);
	if (!match || !Number.isFinite(Date.parse(value))) return false;
	const year = Number(match[1]),
		month = Number(match[2]),
		day = Number(match[3]);
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]!;
}
export class MaterialStore {
	readonly #db: Database.Database;
	readonly #key: string;
	constructor(
		path: string,
		private readonly clock: Clock = new SystemClock(),
	) {
		this.#db = new Database(path);
		try {
			const version = this.#db.pragma("user_version", { simple: true });
			if (version !== 0 && version !== 2) throw new Error("Unsupported database schema.");
			if (
				version === 0 &&
				this.#db
					.prepare(
						"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
					)
					.all().length !== 0
			)
				throw new Error("Refusing to initialize an unrecognized database.");
			this.#db.pragma("journal_mode = WAL");
			this.#db.pragma("synchronous = FULL");
			this.#db.pragma("foreign_keys = ON");
			if (version === 0) {
				this.#db
					.transaction(() => {
						this.#db
							.exec(`CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
					CREATE TABLE spaces (id TEXT PRIMARY KEY, character TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0);
					CREATE TABLE materials (id TEXT PRIMARY KEY, space TEXT NOT NULL REFERENCES spaces(id), world TEXT NOT NULL, body TEXT NOT NULL);
					CREATE TABLE operations (principal TEXT NOT NULL, space TEXT NOT NULL, operation TEXT NOT NULL, digest TEXT NOT NULL, material TEXT NOT NULL REFERENCES materials(id), PRIMARY KEY(principal,space,operation));
					CREATE TABLE episodes (id TEXT NOT NULL, revision INTEGER NOT NULL, space TEXT NOT NULL, world TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(id,revision));
					CREATE TABLE episode_sources (episode TEXT NOT NULL, revision INTEGER NOT NULL, source TEXT NOT NULL, PRIMARY KEY(episode,revision,source));
					CREATE TABLE memory_operations (principal TEXT NOT NULL, space TEXT NOT NULL, operation TEXT NOT NULL, digest TEXT NOT NULL, kind TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(principal,space,operation));
					CREATE TABLE tombstones (id TEXT PRIMARY KEY, space TEXT NOT NULL, world TEXT NOT NULL);
					PRAGMA user_version = 2;`);
						this.#db
							.prepare("INSERT INTO metadata VALUES ('digest_key', ?)")
							.run(randomBytes(32).toString("hex"));
					})
					.immediate();
			}
			this.#key = (
				this.#db.prepare("SELECT value FROM metadata WHERE key='digest_key'").get() as {
					value: string;
				}
			).value;
		} catch (error) {
			this.#db.close();
			throw error;
		}
	}
	bindScope(scope: MemoryScope): void {
		if (Object.values(scope).some((value) => !/^[A-Za-z0-9_-]{1,128}$/.test(value)))
			throw new Error("Invalid configured scope.");
		this.#db
			.prepare("INSERT OR IGNORE INTO spaces(id, character) VALUES (?, ?)")
			.run(scope.space, scope.character);
		const row = this.#db
			.prepare("SELECT character FROM spaces WHERE id=?")
			.get(scope.space) as { character: string };
		if (row.character !== scope.character)
			throw new Error("Space belongs to another character.");
	}
	submit(
		principal: string,
		scope: MemoryScope,
		input: unknown,
	): { material: Material; replayed: boolean } {
		if (!validate(input) || Buffer.byteLength(input.text, "utf8") > 65536)
			throw new MaterialError("VALIDATION_ERROR");
		if (input.authored_at != null && !validTimestamp(input.authored_at))
			throw new MaterialError("VALIDATION_ERROR");
		const normalized = { ...input, authored_at: input.authored_at ?? null };
		const digest = createHmac("sha256", this.#key)
			.update(canonical({ scope, input: normalized }))
			.digest("hex");
		return this.#db
			.transaction(() => {
				this.bindScope(scope);
				if (
					this.#db
						.prepare(
							"SELECT 1 FROM memory_operations WHERE principal=? AND space=? AND operation=?",
						)
						.get(principal, scope.space, input.operation_id)
				)
					throw new MaterialError("IDEMPOTENCY_CONFLICT");
				const prior = this.#db
					.prepare(
						"SELECT digest,material FROM operations WHERE principal=? AND space=? AND operation=?",
					)
					.get(principal, scope.space, input.operation_id) as
					| { digest: string; material: string }
					| undefined;
				if (prior) {
					if (prior.digest !== digest) throw new MaterialError("IDEMPOTENCY_CONFLICT");
					return { material: this.read(scope, prior.material), replayed: true };
				}
				if (input.corrects) this.read(scope, input.corrects);
				this.#db.prepare("UPDATE spaces SET seq=seq+1 WHERE id=?").run(scope.space);
				const seq = (
					this.#db
						.prepare("SELECT CAST(seq AS TEXT) AS seq FROM spaces WHERE id=?")
						.get(scope.space) as { seq: string }
				).seq;
				const material: Material = {
					id: randomUUID(),
					revision: 1,
					commit_seq: seq,
					received_at: this.clock.now().toISOString(),
					space_id: scope.space,
					character_id: scope.character,
					world_id: scope.world,
					text: input.text,
					source_kind: input.source_kind,
					speaker: input.speaker,
					coverage: input.coverage,
					authored_at: normalized.authored_at,
					organization_status: "pending",
					...(input.corrects ? { corrects: input.corrects } : {}),
				};
				this.#db
					.prepare("INSERT INTO materials VALUES (?, ?, ?, ?)")
					.run(material.id, scope.space, scope.world, JSON.stringify(material));
				this.#db
					.prepare("INSERT INTO operations VALUES (?, ?, ?, ?, ?)")
					.run(principal, scope.space, input.operation_id, digest, material.id);
				return { material, replayed: false };
			})
			.immediate();
	}
	read(scope: MemoryScope, id: string): Material {
		const row = this.#db
			.prepare(
				"SELECT m.body FROM materials m JOIN spaces s ON s.id=m.space WHERE m.id=? AND m.space=? AND m.world=? AND s.character=? AND NOT EXISTS (SELECT 1 FROM tombstones t WHERE t.id=m.id)",
			)
			.get(id, scope.space, scope.world, scope.character) as { body: string } | undefined;
		if (!row) throw new MaterialError("NOT_FOUND");
		return JSON.parse(row.body) as Material;
	}
	sequence(scope: MemoryScope): string {
		const row = this.#db
			.prepare("SELECT CAST(seq AS TEXT) AS seq FROM spaces WHERE id=? AND character=?")
			.get(scope.space, scope.character) as { seq: string } | undefined;
		if (!row) throw new MaterialError("NOT_FOUND");
		return row.seq;
	}
	#next(scope: MemoryScope): string {
		this.#db.prepare("UPDATE spaces SET seq=seq+1 WHERE id=?").run(scope.space);
		return this.sequence(scope);
	}
	#operation(
		principal: string,
		scope: MemoryScope,
		kind: string,
		input: { operation_id: string },
		run: () => string,
	): { result: string; replayed: boolean } {
		const digest = createHmac("sha256", this.#key)
			.update(canonical({ scope, kind, input }))
			.digest("hex");
		return this.#db
			.transaction(() => {
				this.bindScope(scope);
				if (
					this.#db
						.prepare(
							"SELECT 1 FROM operations WHERE principal=? AND space=? AND operation=?",
						)
						.get(principal, scope.space, input.operation_id)
				)
					throw new MaterialError("IDEMPOTENCY_CONFLICT");
				const row = this.#db
					.prepare(
						"SELECT digest,result FROM memory_operations WHERE principal=? AND space=? AND operation=?",
					)
					.get(principal, scope.space, input.operation_id) as
					| { digest: string; result: string }
					| undefined;
				if (row) {
					if (row.digest !== digest) throw new MaterialError("IDEMPOTENCY_CONFLICT");
					return { result: row.result, replayed: true };
				}
				const result = run();
				this.#db
					.prepare("INSERT INTO memory_operations VALUES (?,?,?,?,?,?)")
					.run(principal, scope.space, input.operation_id, digest, kind, result);
				return { result, replayed: false };
			})
			.immediate();
	}
	organize(principal: string, scope: MemoryScope, input: unknown) {
		if (!validateOrganization(input) || Boolean(input.id) !== Boolean(input.expected_revision))
			throw new MaterialError("VALIDATION_ERROR");
		const operation = this.#operation(principal, scope, "organize", input, () => {
			if (this.sequence(scope) !== input.base_seq) throw new MaterialError("STALE_BASIS");
			for (const id of input.source_ids) this.read(scope, id);
			for (const part of [...input.beats, ...input.interpretations])
				for (const id of part.source_ids) {
					if (!input.source_ids.includes(id)) throw new MaterialError("SOURCE_INVALID");
					if (
						"kind" in part &&
						part.kind === "expressed" &&
						this.read(scope, id).source_kind !== "character_statement"
					)
						throw new MaterialError("SOURCE_INVALID");
				}
			const id = input.id ?? randomUUID();
			let revision = 1;
			if (input.id) {
				const old = this.episode(scope, id);
				if (old.revision !== input.expected_revision)
					throw new MaterialError("REVISION_CONFLICT");
				revision = old.revision + 1;
			}
			const {
				operation_id: _op,
				base_seq: _base,
				expected_revision: _expected,
				...body
			} = input;
			const episode: Episode = {
				...body,
				id,
				revision,
				commit_seq: this.#next(scope),
				recorded_at: this.clock.now().toISOString(),
				semantic_status: "model_proposed",
			};
			this.#db
				.prepare("INSERT INTO episodes VALUES (?,?,?,?,?)")
				.run(id, revision, scope.space, scope.world, JSON.stringify(episode));
			for (const source of input.source_ids)
				this.#db
					.prepare("INSERT INTO episode_sources VALUES (?,?,?)")
					.run(id, revision, source);
			return JSON.stringify({ id, revision });
		});
		const ref = JSON.parse(operation.result) as { id: string; revision: number };
		return { episode: this.episode(scope, ref.id, ref.revision), replayed: operation.replayed };
	}
	episode(scope: MemoryScope, id: string, revision?: number): Episode {
		this.sequence(scope);
		const row = this.#db
			.prepare(
				`SELECT body FROM episodes WHERE id=? AND space=? AND world=? ${revision === undefined ? "" : "AND revision=?"} ORDER BY revision DESC LIMIT 1`,
			)
			.get(
				...(revision === undefined
					? [id, scope.space, scope.world]
					: [id, scope.space, scope.world, revision]),
			) as { body: string } | undefined;
		if (!row) throw new MaterialError("NOT_FOUND");
		const ep = JSON.parse(row.body) as Episode;
		for (const source of ep.source_ids) this.read(scope, source);
		return ep;
	}
	history(scope: MemoryScope, id: string): Episode[] {
		this.episode(scope, id);
		const rows = this.#db
			.prepare(
				"SELECT revision FROM episodes WHERE id=? AND space=? AND world=? ORDER BY revision",
			)
			.all(id, scope.space, scope.world) as { revision: number }[];
		return rows.map((row) => this.episode(scope, id, row.revision));
	}
	recall(scope: MemoryScope, input: unknown) {
		if (!validateRecall(input)) throw new MaterialError("VALIDATION_ERROR");
		const snapshot_seq = this.sequence(scope);
		const limit = input.limit ?? 6,
			maxBytes = input.max_bytes ?? 16384;
		const rows = this.#db
			.prepare(
				"SELECT m.body FROM materials m WHERE m.space=? AND m.world=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id) ORDER BY rowid DESC LIMIT 2001",
			)
			.all(scope.space, scope.world) as { body: string }[];
		const raw = rows.slice(0, 2000).map((row) => JSON.parse(row.body) as Material);
		const epRows = this.#db
			.prepare(
				"SELECT e.id FROM episodes e WHERE e.space=? AND e.world=? AND e.revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id) ORDER BY rowid DESC LIMIT 501",
			)
			.all(scope.space, scope.world) as { id: string }[];
		const episodes: Episode[] = [];
		for (const row of epRows.slice(0, 500)) {
			try {
				episodes.push(this.episode(scope, row.id));
			} catch (error) {
				if (!(error instanceof MaterialError)) throw error;
			}
		}
		const q = input.query.normalize("NFKC").toLowerCase().trim();
		const chars = Array.from(q),
			tokens = new Set<string>(q.match(/[a-z0-9]+/g) ?? []);
		for (let i = 0; i < chars.length - 1; i++)
			if (/\p{Script=Han}/u.test(chars[i]! + chars[i + 1]!))
				tokens.add(chars[i]! + chars[i + 1]!);
		if (tokens.size === 0 && q) tokens.add(q);
		const score = (text: string) => {
			const value = text.normalize("NFKC").toLowerCase();
			return !q
				? 1
				: (value.includes(q) ? 10 : 0) +
						[...tokens].filter((token) => value.includes(token)).length;
		};
		const candidates = [
			...raw.map((material) => ({
				kind: "material",
				id: material.id,
				score: score(material.text),
				value: material as Material | Episode,
			})),
			...episodes.map((ep) => ({
				kind: "episode",
				id: ep.id,
				score: score(JSON.stringify(ep)),
				value: ep as Material | Episode,
			})),
		]
			.filter((item) => item.score > 0)
			.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
		const output: {
			snapshot_seq: string;
			items: unknown[];
			coverage: {
				candidate_scan_truncated: boolean;
				output_truncated: boolean;
				retrieval_exhaustiveness: string;
			};
			budget: { max_bytes: number };
		} = {
			snapshot_seq,
			items: [],
			coverage: {
				candidate_scan_truncated: rows.length > 2000 || epRows.length > 500,
				output_truncated: false,
				retrieval_exhaustiveness: "unknown",
			},
			budget: { max_bytes: maxBytes },
		};
		for (const item of candidates) {
			if (output.items.length >= limit) {
				output.coverage.output_truncated = true;
				break;
			}
			const sourceIds =
				item.kind === "episode" ? (item.value as Episode).source_ids : [item.id];
			const corrections = raw.filter(
				(material) =>
					material.corrects &&
					sourceIds.includes(material.corrects) &&
					!sourceIds.includes(material.id),
			);
			const packed = {
				...item,
				score: undefined,
				corrections,
				stale: corrections.length > 0,
			};
			output.items.push(packed);
			if (Buffer.byteLength(JSON.stringify(output), "utf8") > maxBytes) {
				output.items.pop();
				output.coverage.output_truncated = true;
				const directory = { kind: item.kind, id: item.id, requires_expansion: true };
				output.items.push(directory);
				if (Buffer.byteLength(JSON.stringify(output), "utf8") > maxBytes)
					output.items.pop();
			}
		}
		return output;
	}
	delete(principal: string, scope: MemoryScope, input: unknown) {
		if (!validateDelete(input)) throw new MaterialError("VALIDATION_ERROR");
		const operation = this.#operation(principal, scope, "delete", input, () => {
			for (const id of input.source_ids) this.read(scope, id);
			const deleted = new Set(input.source_ids);
			const queue = [...input.source_ids];
			while (queue.length) {
				const parent = queue.shift()!;
				const descendants = this.#db
					.prepare(
						"SELECT id FROM materials WHERE space=? AND world=? AND json_extract(body, '$.corrects')=?",
					)
					.all(scope.space, scope.world, parent) as { id: string }[];
				for (const child of descendants)
					if (!deleted.has(child.id)) {
						deleted.add(child.id);
						queue.push(child.id);
					}
			}
			for (const id of deleted) {
				this.#db
					.prepare("INSERT OR IGNORE INTO tombstones VALUES (?,?,?)")
					.run(id, scope.space, scope.world);
				const affected = this.#db
					.prepare("SELECT DISTINCT episode FROM episode_sources WHERE source=?")
					.all(id) as { episode: string }[];
				for (const ep of affected) {
					this.#db.prepare("DELETE FROM episodes WHERE id=?").run(ep.episode);
					this.#db.prepare("DELETE FROM episode_sources WHERE episode=?").run(ep.episode);
				}
				this.#db.prepare("UPDATE materials SET body='{}' WHERE id=?").run(id);
			}
			return JSON.stringify({
				deleted_ids: [...deleted],
				commit_seq: this.#next(scope),
				online_blocked: true,
				backup_cleanup: "not_supported",
			});
		});
		return { ...JSON.parse(operation.result), replayed: operation.replayed };
	}
	close(): void {
		this.#db.close();
	}
}
