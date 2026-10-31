import previewDeleteSchema from "../contracts/schemas/preview-delete.json" with { type: "json" };
import amendSchema from "../contracts/schemas/amend-memory.json" with { type: "json" };
import type { PreviewDelete } from "../contracts/generated/preview-delete.js";
import type { AmendMemory } from "../contracts/generated/amend-memory.js";
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
const validatePreviewDelete = validator.compile<PreviewDelete>(previewDeleteSchema);
const validateAmend = validator.compile<AmendMemory>(amendSchema);
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
			| "SOURCE_INVALID"
			| "STALE_PREVIEW",
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
	organization_status: "pending" | "organized";
	channel?: string;
	conversation_id?: string;
	thread?: string;
	context_role?: "historical_background";
	correction_ids?: string[];
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
	submit(principal: string, scope: MemoryScope, input: unknown) {
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
					return {
						material: this.read(scope, prior.material),
						replayed: true,
						duplicate_candidates: this.#duplicates(scope, input.text, prior.material),
					};
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
					...(input.channel ? { channel: input.channel } : {}),
					...(input.conversation_id ? { conversation_id: input.conversation_id } : {}),
					...(input.thread ? { thread: input.thread } : {}),
				};
				this.#db
					.prepare("INSERT INTO materials VALUES (?, ?, ?, ?)")
					.run(material.id, scope.space, scope.world, JSON.stringify(material));
				this.#db
					.prepare("INSERT INTO operations VALUES (?, ?, ?, ?, ?)")
					.run(principal, scope.space, input.operation_id, digest, material.id);
				return {
					material: this.read(scope, material.id),
					replayed: false,
					duplicate_candidates: this.#duplicates(scope, input.text, material.id),
				};
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
		const material = JSON.parse(row.body) as Material;
		return {
			...material,
			organization_status: this.#organized(id) ? "organized" : "pending",
			context_role: "historical_background",
			correction_ids: this.#children(scope, id),
		};
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
	#checkProposal(scope: MemoryScope, input: unknown): asserts input is OrganizeMemory {
		if (!validateOrganization(input) || Boolean(input.id) !== Boolean(input.expected_revision))
			throw new MaterialError("VALIDATION_ERROR");
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
		if (input.id && this.episode(scope, input.id).revision !== input.expected_revision)
			throw new MaterialError("REVISION_CONFLICT");
	}
	previewOrganization(scope: MemoryScope, input: unknown) {
		this.#checkProposal(scope, input);
		const old = input.id ? this.episode(scope, input.id) : undefined;
		const keys = [
			"title",
			"summary",
			"source_ids",
			"beats",
			"interpretations",
			"thread",
			"activity_state",
			"unknowns",
		] as const;
		const changes = keys
			.filter((key) => canonical(old?.[key] ?? null) !== canonical(input[key]))
			.map((field) => ({ field, before: old?.[field] ?? null, after: input[field] }));
		const overlapping = new Set<string>();
		for (const source of input.source_ids) {
			const rows = this.#db
				.prepare(
					"SELECT DISTINCT e.id FROM episodes e JOIN episode_sources es ON es.episode=e.id AND es.revision=e.revision WHERE es.source=? AND e.space=? AND e.world=? AND e.revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id)",
				)
				.all(source, scope.space, scope.world) as { id: string }[];
			for (const row of rows) if (row.id !== input.id) overlapping.add(row.id);
		}
		return {
			dry_run: true,
			snapshot_seq: this.sequence(scope),
			changes,
			removed_source_ids:
				old?.source_ids.filter((id) => !input.source_ids.includes(id)) ?? [],
			overlapping_episode_ids: [...overlapping],
			semantic_conflict_check: "not_performed",
			context_role: "historical_background",
			semantic_status: "model_proposed",
		};
	}
	amend(principal: string, scope: MemoryScope, input: unknown) {
		if (!validateAmend(input)) throw new MaterialError("VALIDATION_ERROR");
		// Reconstruct from the requested immutable revision so a retry has the same digest.
		const old = this.episode(scope, input.id, input.expected_revision);
		const {
			revision: _revision,
			commit_seq: _seq,
			recorded_at: _time,
			semantic_status: _semantic,
			stale: _stale,
			...body
		} = old;
		const proposal = {
			...body,
			operation_id: input.operation_id,
			base_seq: input.base_seq,
			expected_revision: input.expected_revision,
			source_ids: [...new Set([...old.source_ids, ...(input.append_source_ids ?? [])])],
			beats: [...old.beats, ...(input.append_beats ?? [])],
			interpretations: [...old.interpretations, ...(input.append_interpretations ?? [])],
			unknowns: [...new Set([...old.unknowns, ...(input.append_unknowns ?? [])])],
			title: input.title ?? old.title,
			summary: input.summary ?? old.summary,
			thread: input.thread === undefined ? old.thread : input.thread,
			activity_state: input.activity_state ?? old.activity_state,
		};
		return input.dry_run
			? this.previewOrganization(scope, proposal)
			: this.organize(principal, scope, proposal);
	}
	organize(principal: string, scope: MemoryScope, input: unknown) {
		if (!validateOrganization(input) || Boolean(input.id) !== Boolean(input.expected_revision))
			throw new MaterialError("VALIDATION_ERROR");
		const operation = this.#operation(principal, scope, "organize", input, () => {
			this.#checkProposal(scope, input);
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
	#organized(id: string): boolean {
		return Boolean(
			this.#db
				.prepare(
					"SELECT 1 FROM episode_sources es JOIN episodes e ON e.id=es.episode AND e.revision=es.revision WHERE es.source=? AND e.revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id) LIMIT 1",
				)
				.get(id),
		);
	}
	#duplicates(scope: MemoryScope, text: string, id: string) {
		const matches = (
			this.#db
				.prepare(
					"SELECT id FROM materials m WHERE space=? AND world=? AND id!=? AND json_extract(body,'$.text')=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id) ORDER BY rowid DESC LIMIT 11",
				)
				.all(scope.space, scope.world, id, text) as { id: string }[]
		).map((row) => row.id);
		return {
			ids: matches.slice(0, 10),
			truncated: matches.length > 10,
			match: "exact_text",
			automatically_merged: false,
		};
	}
	#children(scope: MemoryScope, id: string): string[] {
		return (
			this.#db
				.prepare(
					"SELECT id FROM materials m WHERE space=? AND world=? AND json_extract(body,'$.corrects')=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id)",
				)
				.all(scope.space, scope.world, id) as { id: string }[]
		).map((row) => row.id);
	}
	#descendants(scope: MemoryScope, ids: string[]): string[] {
		const visited = new Set(ids),
			queue = [...ids];
		for (let i = 0; i < queue.length; i++)
			for (const id of this.#children(scope, queue[i]!))
				if (!visited.has(id)) {
					visited.add(id);
					queue.push(id);
				}
		return [...visited].sort();
	}
	status(scope: MemoryScope) {
		const snapshot_seq = this.sequence(scope);
		const materials = this.#db
			.prepare(
				"SELECT id,body FROM materials m WHERE space=? AND world=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id) ORDER BY rowid DESC",
			)
			.iterate(scope.space, scope.world) as Iterable<{ id: string; body: string }>;
		let total = 0,
			organized = 0,
			oldestPending: string | null = null;
		const recent: { id: string; commit_seq: string; received_at: string }[] = [];
		for (const row of materials) {
			const m = JSON.parse(row.body) as Material;
			total++;
			if (this.#organized(row.id)) organized++;
			else oldestPending = m.commit_seq;
			if (recent.length < 5)
				recent.push({ id: row.id, commit_seq: m.commit_seq, received_at: m.received_at });
		}
		const episodes = this.#db
			.prepare(
				"SELECT COUNT(DISTINCT id) AS total, COUNT(*) AS revisions, MAX(CAST(json_extract(body,'$.commit_seq') AS INTEGER)) AS latest FROM episodes WHERE space=? AND world=?",
			)
			.get(scope.space, scope.world) as {
			total: number;
			revisions: number;
			latest: number | null;
		};
		return {
			materials: true,
			organization: "external_model_proposals",
			deletion: "preview_required",
			recall: "lexical_full_scan",
			snapshot_seq,
			counts: {
				materials: total,
				pending: total - organized,
				organized,
				episodes: episodes.total,
				episode_revisions: episodes.revisions,
			},
			oldest_pending_seq: oldestPending,
			latest_organization_seq: episodes.latest === null ? null : String(episodes.latest),
			organization_complete: total === organized,
			recent_materials: recent,
			state_meaning: "organized means referenced by a current episode, not verified as true",
		};
	}
	recall(scope: MemoryScope, input: unknown) {
		if (!validateRecall(input)) throw new MaterialError("VALIDATION_ERROR");
		for (const time of [input.from, input.to])
			if (time && !validTimestamp(time)) throw new MaterialError("VALIDATION_ERROR");
		if (input.from && input.to && Date.parse(input.from) > Date.parse(input.to))
			throw new MaterialError("VALIDATION_ERROR");
		if (input.kind === "episode" && input.organization_status)
			throw new MaterialError("VALIDATION_ERROR");
		const snapshot_seq = this.sequence(scope),
			limit = input.limit ?? 6,
			maxBytes = input.max_bytes ?? 16384;
		const q = input.query.normalize("NFKC").toLowerCase().trim();
		if (input.before_seq && q) throw new MaterialError("VALIDATION_ERROR");
		const tokens = new Set<string>(q.match(/[a-z0-9]+/g) ?? []),
			chars = Array.from(q);
		for (let i = 0; i < chars.length - 1; i++)
			if (/^\p{Script=Han}{2}$/u.test(chars[i]! + chars[i + 1]!))
				tokens.add(chars[i]! + chars[i + 1]!);
		if (!tokens.size && q) tokens.add(q);
		type Candidate = {
			kind: "material" | "episode";
			id: string;
			seq: string;
			text: string;
			time: string | null;
			value: Material | Episode;
			terms: string[];
			score: number;
		};
		const top: Candidate[] = [];
		let scanned = 0,
			eligible = 0,
			matched = 0;
		const basis = input.time_basis ?? "received_at";
		const consider = (kind: Candidate["kind"], value: Material | Episode) => {
			scanned++;
			if (input.before_seq && BigInt(value.commit_seq) >= BigInt(input.before_seq)) return;
			const isMaterial = kind === "material",
				m = value as Material,
				ep = value as Episode;
			if (
				input.organization_status &&
				(!isMaterial ||
					(this.#organized(value.id) ? "organized" : "pending") !==
						input.organization_status)
			)
				return;
			if (input.thread && value.thread !== input.thread) return;
			// Authored time and channel are material metadata; never invent an episode timestamp or channel.
			if (input.channel && (!isMaterial || m.channel !== input.channel)) return;
			const time =
				basis === "authored_at"
					? isMaterial
						? m.authored_at
						: null
					: isMaterial
						? m.received_at
						: ep.recorded_at;
			if (
				(input.from || input.to) &&
				(!time ||
					(input.from && Date.parse(time) < Date.parse(input.from)) ||
					(input.to && Date.parse(time) > Date.parse(input.to)))
			)
				return;
			eligible++;
			const text = isMaterial
				? m.text
				: [
						ep.title,
						ep.summary,
						...ep.beats.map((x) => x.text),
						...ep.interpretations.map((x) => x.text),
						...ep.unknowns,
					].join("\n");
			const normalized = text.normalize("NFKC").toLowerCase(),
				terms = [...tokens].filter((t) => normalized.includes(t));
			const score = q ? (normalized.includes(q) ? 10 : 0) + terms.length : 1;
			if (!score) return;
			matched++;
			top.push({
				kind,
				id: value.id,
				seq: value.commit_seq,
				text,
				time,
				value,
				terms,
				score,
			});
			top.sort(
				(a, b) =>
					b.score - a.score ||
					(BigInt(a.seq) > BigInt(b.seq)
						? -1
						: BigInt(a.seq) < BigInt(b.seq)
							? 1
							: a.id.localeCompare(b.id)),
			);
			if (top.length > limit + 1) top.pop();
		};
		if (input.kind !== "episode")
			for (const row of this.#db
				.prepare(
					"SELECT body FROM materials m WHERE space=? AND world=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id)",
				)
				.iterate(scope.space, scope.world) as Iterable<{ body: string }>)
				consider("material", JSON.parse(row.body));
		if (input.kind !== "material" && !input.organization_status)
			for (const row of this.#db
				.prepare(
					"SELECT body FROM episodes e WHERE space=? AND world=? AND revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id)",
				)
				.iterate(scope.space, scope.world) as Iterable<{ body: string }>)
				consider("episode", JSON.parse(row.body));
		const output = {
			snapshot_seq,
			context_role: "historical_background",
			items: [] as unknown[],
			coverage: {
				candidate_scan_truncated: false,
				output_truncated: matched > limit,
				retrieval_exhaustiveness: "unknown",
			},
			budget: { max_bytes: maxBytes },
			diagnostics: {
				strategy: "lexical_full_scan",
				scanned,
				eligible,
				matched,
				returned: 0,
				model_usage: "unknown",
				time_basis: basis,
			},
		};
		for (const item of top.slice(0, limit)) {
			const sources =
				item.kind === "material" ? [item.id] : (item.value as Episode).source_ids;
			const corrections = this.#descendants(scope, sources).filter(
				(id) => !sources.includes(id),
			);
			const index =
				item.terms.map((t) => item.text.toLowerCase().indexOf(t)).find((i) => i >= 0) ?? 0;
			const start = Math.max(0, Array.from(item.text.slice(0, index)).length - 40);
			const excerpt = Array.from(item.text)
				.slice(start, start + 180)
				.join("");
			const packed = {
				kind: item.kind,
				id: item.id,
				commit_seq: item.seq,
				time: item.time,
				time_kind:
					basis === "authored_at"
						? "authored_at"
						: item.kind === "material"
							? "received_at"
							: "recorded_at",
				channel: item.kind === "material" ? (item.value as Material).channel : undefined,
				thread: item.value.thread,
				source_kind:
					item.kind === "material" ? (item.value as Material).source_kind : undefined,
				excerpt,
				excerpt_kind: item.kind === "material" ? "source_quote" : "model_proposed_episode",
				match_reason: q ? "lexical_overlap" : "recent",
				matched_terms: item.terms.slice(0, 8),
				organization_status:
					item.kind === "material"
						? this.#organized(item.id)
							? "organized"
							: "pending"
						: undefined,
				source_ids: sources,
				correction_ids: corrections.slice(0, 8),
				correction_count: corrections.length,
				stale: corrections.length > 0,
				requires_expansion: true,
			};
			output.items.push(packed);
			output.diagnostics.returned = output.items.length;
			if (Buffer.byteLength(JSON.stringify(output), "utf8") > maxBytes) {
				output.items.pop();
				output.coverage.output_truncated = true;
				output.items.push({
					kind: item.kind,
					id: item.id,
					stale: corrections.length > 0,
					requires_expansion: true,
				});
				if (Buffer.byteLength(JSON.stringify(output), "utf8") > maxBytes)
					output.items.pop();
				output.diagnostics.returned = output.items.length;
			}
		}
		return output;
	}
	#deletionImpact(scope: MemoryScope, sourceIds: string[]) {
		for (const id of sourceIds) this.read(scope, id);
		const source_ids = this.#descendants(scope, sourceIds),
			episodes = new Map<string, number>();
		for (const id of source_ids)
			for (const row of this.#db
				.prepare(
					"SELECT DISTINCT e.id FROM episodes e JOIN episode_sources es ON es.episode=e.id WHERE es.source=? AND e.space=? AND e.world=?",
				)
				.all(id, scope.space, scope.world) as { id: string }[]) {
				if (!episodes.has(row.id))
					episodes.set(
						row.id,
						(
							this.#db
								.prepare("SELECT COUNT(*) AS n FROM episodes WHERE id=?")
								.get(row.id) as { n: number }
						).n,
					);
			}
		return {
			source_ids,
			episodes: [...episodes]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([id, revisions]) => ({ id, revisions })),
		};
	}
	previewDelete(scope: MemoryScope, input: unknown) {
		if (!validatePreviewDelete(input)) throw new MaterialError("VALIDATION_ERROR");
		const snapshot_seq = this.sequence(scope),
			impact = this.#deletionImpact(scope, input.source_ids);
		const preview_token = createHmac("sha256", this.#key)
			.update(
				canonical({
					scope,
					snapshot_seq,
					requested_ids: [...input.source_ids].sort(),
					impact,
				}),
			)
			.digest("hex");
		return {
			dry_run: true,
			snapshot_seq,
			...impact,
			preview_token,
			backup_cleanup: "not_supported",
			counts: {
				materials: impact.source_ids.length,
				episodes: impact.episodes.length,
				revisions: impact.episodes.reduce((n, e) => n + e.revisions, 0),
			},
		};
	}
	delete(principal: string, scope: MemoryScope, input: unknown) {
		if (!validateDelete(input)) throw new MaterialError("VALIDATION_ERROR");
		const operation = this.#operation(principal, scope, "delete", input, () => {
			const preview = this.previewDelete(scope, { source_ids: input.source_ids });
			if (preview.preview_token !== input.preview_token)
				throw new MaterialError("STALE_PREVIEW");
			const deleted = new Set(preview.source_ids);
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
