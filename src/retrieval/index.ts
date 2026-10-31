import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import type { MemoryScope, Material, Episode } from "../storage/materials.js";
import type { Clock } from "../domain/clock.js";
import { EmbeddingError, type EmbeddingProvider } from "../providers/embedding.js";
import {
	ANALYZER_VERSION,
	indexText,
	matchExpression,
	normalizeVector,
	cosineNormalized,
} from "./algorithms.js";

export const CHUNK_VERSION = "codepoints-1024-overlap128-v1";
export type Kind = "material" | "episode";
export interface Hit {
	id: string;
	kind: Kind;
	start: number;
	score: number;
}
interface Chunk {
	key: string;
	id: string;
	kind: Kind;
	text: string;
	start: number;
}
export function searchText(kind: Kind, value: Material | Episode): string {
	if (kind === "material") return (value as Material).text;
	const ep = value as Episode;
	return [
		ep.title,
		ep.summary,
		...ep.beats.map((x) => x.text),
		...ep.interpretations.map((x) => x.text),
		...ep.unknowns,
	].join("\n");
}

/** Derived data only. Mutations are called inside the authoritative write transaction. */
export class SearchIndex {
	readonly profile: string | null;
	#busy = false;
	constructor(
		private readonly db: Database.Database,
		private readonly clock: Clock,
		readonly provider?: EmbeddingProvider,
	) {
		this.profile = provider
			? createHash("sha256")
					.update(
						JSON.stringify([
							provider.config.endpoint,
							provider.config.model,
							provider.config.dimensions,
							provider.config.api_key_env ?? null,
							provider.config.request_dimensions ?? false,
							ANALYZER_VERSION,
							CHUNK_VERSION,
						]),
					)
					.digest("hex")
			: null;
	}
	initialize() {
		this.db.exec(`CREATE TABLE search_chunks (
			key TEXT PRIMARY KEY, id TEXT NOT NULL, kind TEXT NOT NULL, space TEXT NOT NULL,
			world TEXT NOT NULL, revision INTEGER NOT NULL, start INTEGER NOT NULL, text TEXT NOT NULL);
			CREATE INDEX search_scope ON search_chunks(space,world,id);
			CREATE VIRTUAL TABLE search_fts USING fts5(tokens);
			CREATE TABLE search_vectors (chunk TEXT NOT NULL REFERENCES search_chunks(key) ON DELETE CASCADE,
			profile TEXT NOT NULL, vector TEXT NOT NULL, PRIMARY KEY(chunk,profile));
			CREATE TABLE embedding_usage (day TEXT PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0,
			completed INTEGER NOT NULL DEFAULT 0, known_tokens INTEGER NOT NULL DEFAULT 0,
			unknown_token_responses INTEGER NOT NULL DEFAULT 0);
			CREATE TRIGGER search_chunk_deleted AFTER DELETE ON search_chunks BEGIN
				DELETE FROM search_fts WHERE rowid=old.rowid;
			END;`);
		for (const kind of ["material", "episode"] as const) {
			let cursor = 0;
			const query =
				kind === "material"
					? "SELECT m.rowid AS cursor,m.space,m.world,m.body FROM materials m WHERE m.rowid>? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id) ORDER BY m.rowid LIMIT 100"
					: "SELECT e.rowid AS cursor,e.space,e.world,e.body FROM episodes e WHERE e.rowid>? AND revision=(SELECT MAX(revision) FROM episodes x WHERE x.id=e.id) ORDER BY e.rowid LIMIT 100";
			while (true) {
				// Exhaust each read statement before writing on better-sqlite3's same connection.
				const rows = this.db.prepare(query).all(cursor) as {
					cursor: number;
					space: string;
					world: string;
					body: string;
				}[];
				if (!rows.length) break;
				for (const row of rows) this.replace(row, kind, JSON.parse(row.body));
				cursor = rows[rows.length - 1]!.cursor;
			}
		}
		this.db
			.prepare("INSERT INTO metadata VALUES ('search_version',?)")
			.run(`${ANALYZER_VERSION}/${CHUNK_VERSION}`);
	}
	verify() {
		const version = this.db
			.prepare("SELECT value FROM metadata WHERE key='search_version'")
			.get() as { value: string } | undefined;
		if (version?.value !== `${ANALYZER_VERSION}/${CHUNK_VERSION}`)
			throw new Error("Unsupported search index version.");
	}
	remove(id: string) {
		this.db.prepare("DELETE FROM search_chunks WHERE id=?").run(id);
	}
	replace(scope: Pick<MemoryScope, "space" | "world">, kind: Kind, value: Material | Episode) {
		this.remove(value.id);
		const chars = Array.from(searchText(kind, value));
		for (let start = 0; start < chars.length; start += 896) {
			const text = chars.slice(start, start + 1024).join("");
			if (text.trim()) {
				const key = createHash("sha256")
					.update(
						JSON.stringify([
							value.id,
							kind,
							value.revision,
							start,
							text,
							CHUNK_VERSION,
						]),
					)
					.digest("hex");
				const row = this.db
					.prepare("INSERT INTO search_chunks VALUES (?,?,?,?,?,?,?,?)")
					.run(
						key,
						value.id,
						kind,
						scope.space,
						scope.world,
						value.revision,
						start,
						text,
					);
				this.db
					.prepare("INSERT INTO search_fts(rowid,tokens) VALUES (?,?)")
					.run(row.lastInsertRowid, indexText(text));
			}
			if (start + 1024 >= chars.length) break;
		}
	}
	lexical(scope: MemoryScope, query: string): Hit[] {
		const expression = matchExpression(query);
		if (!expression) return [];
		const hits = new Map<string, Hit>();
		for (const hit of this.db
			.prepare(`SELECT c.id,c.kind,c.start,bm25(search_fts) AS score
			FROM search_fts JOIN search_chunks c ON c.rowid=search_fts.rowid
			WHERE search_fts MATCH ? AND c.space=? AND c.world=? ORDER BY score,c.id,c.start`)
			.iterate(expression, scope.space, scope.world) as Iterable<Hit>)
			if (!hits.has(hit.id)) hits.set(hit.id, hit);
		return [...hits.values()];
	}
	semantic(scope: MemoryScope, vector: number[]): Hit[] {
		const hits = new Map<string, Hit>();
		for (const row of this.db
			.prepare(`SELECT c.id,c.kind,c.start,v.vector FROM search_vectors v
			JOIN search_chunks c ON c.key=v.chunk WHERE v.profile=? AND c.space=? AND c.world=?`)
			.iterate(this.profile, scope.space, scope.world) as Iterable<
			Hit & { vector: string }
		>) {
			const score = cosineNormalized(
				vector,
				normalizeVector(JSON.parse(row.vector), vector.length),
			);
			if (score < (this.provider?.config.min_similarity ?? 0.2)) continue;
			if (!hits.has(row.id) || hits.get(row.id)!.score < score)
				hits.set(row.id, { id: row.id, kind: row.kind, start: row.start, score });
		}
		return [...hits.values()].sort(
			(a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
		);
	}
	#day() {
		return this.clock.now().toISOString().slice(0, 10);
	}
	status(scope: MemoryScope) {
		const counts = this.db
			.prepare(`SELECT COUNT(*) AS chunks, COUNT(v.chunk) AS embedded_chunks
			FROM search_chunks c LEFT JOIN search_vectors v ON v.chunk=c.key AND v.profile=? WHERE c.space=? AND c.world=?`)
			.get(this.profile, scope.space, scope.world) as {
			chunks: number;
			embedded_chunks: number;
		};
		const usage = (this.db
			.prepare(
				"SELECT requests,completed,known_tokens,unknown_token_responses FROM embedding_usage WHERE day=?",
			)
			.get(this.#day()) as
			| {
					requests: number;
					completed: number;
					known_tokens: number;
					unknown_token_responses: number;
			  }
			| undefined) ?? {
			requests: 0,
			completed: 0,
			known_tokens: 0,
			unknown_token_responses: 0,
		};
		return {
			...counts,
			pending_chunks: counts.chunks - counts.embedded_chunks,
			semantic_enabled: !!this.provider,
			profile: this.profile,
			analyzer: ANALYZER_VERSION,
			chunker: CHUNK_VERSION,
			usage: { day: this.#day(), database_wide: true, ...usage },
			max_requests_per_day: this.provider?.config.max_requests_per_day ?? 0,
		};
	}
	async #embed(input: string[]) {
		if (!this.provider) throw new EmbeddingError("EMBEDDING_DISABLED");
		const day = this.#day();
		this.db
			.transaction(() => {
				this.db.prepare("INSERT OR IGNORE INTO embedding_usage(day) VALUES (?)").run(day);
				const result = this.db
					.prepare(
						"UPDATE embedding_usage SET requests=requests+1 WHERE day=? AND requests<?",
					)
					.run(day, this.provider!.config.max_requests_per_day);
				if (!result.changes) throw new EmbeddingError("EMBEDDING_BUDGET");
			})
			.immediate();
		// Reservations survive failures/restarts; no automatic retries or refunds.
		const response = await this.provider.embed(input);
		if (response.vectors.length !== input.length)
			throw new EmbeddingError("EMBEDDING_RESPONSE");
		const vectors = response.vectors.map((v) =>
			normalizeVector(v, this.provider!.config.dimensions),
		);
		this.db
			.prepare(
				"UPDATE embedding_usage SET completed=completed+1,known_tokens=known_tokens+?,unknown_token_responses=unknown_token_responses+? WHERE day=?",
			)
			.run(response.tokens ?? 0, response.tokens === null ? 1 : 0, day);
		return vectors;
	}
	async query(text: string) {
		return (await this.#embed([text]))[0]!;
	}
	async index(scope: MemoryScope, maxBatches: number) {
		if (this.#busy) throw new EmbeddingError("EMBEDDING_BUSY");
		if (!this.provider) throw new EmbeddingError("EMBEDDING_DISABLED");
		this.#busy = true;
		let indexed = 0,
			discarded = 0,
			batches = 0,
			stopped: string | null = null;
		try {
			for (; batches < maxBatches; batches++) {
				const rows = this.db
					.prepare(`SELECT c.key,c.id,c.kind,c.text,c.start FROM search_chunks c
					WHERE c.space=? AND c.world=? AND NOT EXISTS(SELECT 1 FROM search_vectors v WHERE v.chunk=c.key AND v.profile=?)
					ORDER BY c.rowid LIMIT 8`)
					.all(scope.space, scope.world, this.profile) as Chunk[];
				if (!rows.length) break;
				let vectors: number[][];
				try {
					vectors = await this.#embed(rows.map((x) => x.text));
				} catch (error) {
					if (!(error instanceof EmbeddingError)) throw error;
					stopped = error.code;
					break;
				}
				this.db
					.transaction(() => {
						for (let i = 0; i < rows.length; i++) {
							// A deleted source or replaced revision cannot be resurrected by late network responses.
							const row = rows[i]!;
							const result = this.db
								.prepare(`INSERT OR IGNORE INTO search_vectors(chunk,profile,vector)
							SELECT key,?,? FROM search_chunks WHERE key=? AND space=? AND world=?`)
								.run(
									this.profile,
									JSON.stringify(vectors[i]),
									row.key,
									scope.space,
									scope.world,
								);
							if (result.changes) indexed++;
							else discarded++;
						}
					})
					.immediate();
			}
			return {
				indexed_chunks: indexed,
				discarded_chunks: discarded,
				batches,
				stopped,
				...this.status(scope),
			};
		} finally {
			this.#busy = false;
		}
	}
}
