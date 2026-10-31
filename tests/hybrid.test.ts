import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { MaterialStore, type MemoryScope } from "../src/storage/materials.js";
import { ManualClock } from "../src/domain/clock.js";
import { EmbeddingError, type EmbeddingProvider } from "../src/providers/embedding.js";

const scope = { space: "home", character: "reader", world: "real" };
const config = {
	endpoint: "https://example.invalid/v1/embeddings",
	model: "fixture-v1",
	dimensions: 2,
	max_requests_per_day: 100,
	timeout_ms: 1000,
};
const material = (operation_id: string, text: string) => ({
	operation_id,
	text,
	source_kind: "character_statement",
	speaker: "reader",
	coverage: "synthetic test",
});
const ids = (result: { items: unknown[] }) => result.items.map((x) => (x as { id: string }).id);
class FixtureProvider implements EmbeddingProvider {
	config = { ...config };
	calls: string[][] = [];
	fail = false;
	async embed(input: string[]) {
		this.calls.push(input);
		if (this.fail) throw new EmbeddingError("EMBEDDING_UNAVAILABLE");
		return {
			vectors: input.map((text) => (/自行车|脚踏出游|单车/.test(text) ? [1, 0] : [0, 1])),
			tokens: input.length,
		};
	}
}
const episode = (
	store: MaterialStore,
	source_ids: string[],
	summary = "旧观点",
	operation_id = "organize",
) => ({
	operation_id,
	base_seq: store.sequence(scope),
	title: "经历",
	summary,
	source_ids,
	beats: [{ text: "当时经过", source_ids }],
	interpretations: [],
	thread: "reading",
	activity_state: "active",
	unknowns: [],
});
function erase(store: MaterialStore, id: string) {
	store.delete("client", scope, {
		operation_id: `erase-${id}`,
		source_ids: [id],
		preview_token: store.previewDelete(scope, { source_ids: [id] }).preview_token,
	});
}

test("hybrid retrieves a paraphrase without lexical overlap and preserves evidence, filters and byte budgets", async () => {
	const provider = new FixtureProvider();
	const store = new MaterialStore(":memory:", undefined, provider);
	try {
		const a = store.submit("client", scope, {
			...material("bike", "我买了一辆自行车。"),
			channel: "qq",
			thread: "travel",
			authored_at: "2026-01-01T00:00:00Z",
		}).material;
		store.submit("client", scope, material("tea", "下午喝茶。"));
		assert.deepEqual(ids(store.recall(scope, { query: "脚踏出游" })), []);
		assert.equal(
			(await store.recallAsync(scope, { query: "脚踏出游" })).diagnostics.semantic.reason,
			"INDEX_PENDING",
		);
		assert.equal(provider.calls.length, 0);
		assert.equal((await store.index(scope, {})).indexed_chunks, 2);
		const result = await store.recallAsync(scope, {
			query: "脚踏出游",
			channel: "qq",
			thread: "travel",
			time_basis: "authored_at",
			from: "2026-01-01T00:00:00Z",
			to: "2026-01-01T00:00:00Z",
		});
		assert.deepEqual(ids(result), [a.id]);
		assert.equal(result.diagnostics.strategy, "fts5_cosine_rrf");
		assert.equal(result.diagnostics.semantic.reason, null);
		const item = result.items[0] as {
			match_reason: string;
			excerpt: string;
			source_ids: string[];
			excerpt_start: number;
			excerpt_end: number;
		};
		assert.equal(item.match_reason, "semantic_similarity");
		assert.deepEqual(item.source_ids, [a.id]);
		assert.equal(
			Array.from(store.read(scope, a.id).text)
				.slice(item.excerpt_start, item.excerpt_end)
				.join(""),
			item.excerpt,
		);
		assert.deepEqual(
			ids(await store.recallAsync(scope, { query: "脚踏出游", channel: "other" })),
			[],
		);
		const compact = await store.recallAsync(scope, { query: "脚踏出游", max_bytes: 1024 });
		assert.ok(Buffer.byteLength(JSON.stringify(compact)) <= 1024);
		assert.ok(ids(compact).includes(a.id));
		const before = provider.calls.length;
		await store.recallAsync(scope, { query: "" });
		await store.recallAsync(scope, { query: "脚踏出游", mode: "lexical" });
		await assert.rejects(store.recallAsync(scope, { query: "脚踏出游", from: "bad" }), {
			message: "VALIDATION_ERROR",
		});
		await assert.rejects(
			store.recallAsync({ ...scope, character: "wrong" }, { query: "脚踏出游" }),
			{ message: "NOT_FOUND" },
		);
		assert.equal(provider.calls.length, before);
	} finally {
		store.close();
	}
});

test("lexical and semantic ranks filter before limiting, deduplicate chunks and never cross scopes", async () => {
	const provider = new FixtureProvider();
	const store = new MaterialStore(":memory:", undefined, provider);
	try {
		const wanted = store.submit("client", scope, {
			...material("wanted", "自行车".repeat(900)),
			thread: "keep",
		}).material;
		for (let i = 0; i < 25; i++)
			store.submit("client", scope, { ...material(`noise${i}`, "自行车"), thread: "skip" });
		const other: MemoryScope = { ...scope, world: "fiction" };
		const hidden = store.submit("client", other, material("hidden", "自行车")).material;
		await store.index(scope, { max_batches: 16 });
		await store.index(other, {});
		const result = await store.recallAsync(scope, {
			query: "自行车",
			thread: "keep",
			limit: 1,
		});
		assert.deepEqual(ids(result), [wanted.id]);
		assert.equal(
			(result.items[0] as { match_reason: string }).match_reason,
			"lexical_and_semantic",
		);
		assert.ok(
			!JSON.stringify(
				await store.recallAsync(scope, { query: "自行车", limit: 20 }),
			).includes(hidden.id),
		);
		assert.deepEqual(ids(await store.recallAsync(other, { query: "脚踏出游" })), [hidden.id]);
		assert.ok(store.status(scope).retrieval.chunks > 26);
	} finally {
		store.close();
	}
});

test("network failures and persistent database-wide budgets degrade explicitly and survive restart", async () => {
	const dir = mkdtempSync(join(tmpdir(), "rag-budget-"));
	const path = join(dir, "memory.db");
	const provider = new FixtureProvider();
	provider.config.max_requests_per_day = 2;
	const clock = new ManualClock("2026-01-01T00:00:00Z");
	let store = new MaterialStore(path, clock, provider);
	try {
		const a = store.submit("client", scope, material("a", "自行车")).material;
		await store.index(scope, {});
		provider.fail = true;
		const failed = await store.recallAsync(scope, { query: "自行车" });
		assert.deepEqual(ids(failed), [a.id]);
		assert.equal(failed.diagnostics.semantic.reason, "EMBEDDING_UNAVAILABLE");
		store.close();
		store = new MaterialStore(path, clock, provider);
		provider.fail = false;
		const budget = await store.recallAsync(scope, { query: "自行车" });
		assert.equal(budget.diagnostics.semantic.reason, "EMBEDDING_BUDGET");
		assert.equal(provider.calls.length, 2);
		assert.equal(store.status(scope).retrieval.usage.requests, 2);
		clock.advanceBy(24 * 60 * 60 * 1000);
		assert.deepEqual(ids(await store.recallAsync(scope, { query: "脚踏出游" })), [a.id]);
		assert.equal(provider.calls.length, 3);
	} finally {
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test("model changes invalidate vector coverage without losing lexical retrieval or restarting completed batches", async () => {
	const dir = mkdtempSync(join(tmpdir(), "rag-model-"));
	const path = join(dir, "memory.db");
	const provider = new FixtureProvider();
	let store = new MaterialStore(path, undefined, provider);
	try {
		for (let i = 0; i < 10; i++) store.submit("client", scope, material(`a${i}`, "自行车"));
		assert.equal((await store.index(scope, {})).pending_chunks, 2);
		store.close();
		store = new MaterialStore(path, undefined, provider);
		assert.equal((await store.index(scope, {})).indexed_chunks, 2);
		assert.equal((await store.index(scope, {})).batches, 0);
		assert.equal(provider.calls.length, 2);
		store.close();
		provider.config.model = "fixture-v2";
		store = new MaterialStore(path, undefined, provider);
		assert.equal(store.status(scope).retrieval.pending_chunks, 10);
		assert.equal(
			(await store.recallAsync(scope, { query: "自行车" })).diagnostics.semantic.reason,
			"INDEX_PENDING",
		);
		assert.equal(store.recall(scope, { query: "自行车", limit: 20 }).items.length, 10);
		assert.equal((await store.index(scope, {})).indexed_chunks, 8);
	} finally {
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test("late embedding responses cannot restore deleted sources or superseded episode revisions", async () => {
	let release!: () => void;
	const barrier = new Promise<void>((resolve) => {
		release = resolve;
	});
	const provider: EmbeddingProvider = {
		config,
		async embed(input) {
			await barrier;
			return { vectors: input.map(() => [1, 0]), tokens: null };
		},
	};
	const store = new MaterialStore(":memory:", undefined, provider);
	try {
		const source = store.submit("client", scope, material("source", "原文")).material;
		const removed = store.submit("client", scope, material("removed", "秘密")).material;
		const first = store.organize("client", scope, episode(store, [source.id])).episode;
		const indexing = store.index(scope, {});
		await assert.rejects(store.index(scope, {}), { message: "EMBEDDING_BUSY" });
		erase(store, removed.id);
		store.organize("client", scope, {
			...episode(store, [source.id], "新观点", "revise"),
			id: first.id,
			expected_revision: 1,
		});
		release();
		const result = await indexing;
		assert.equal(result.discarded_chunks, 2);
		assert.equal(result.indexed_chunks, 1);
		assert.equal(result.pending_chunks, 1);
		assert.ok(!ids(store.recall(scope, { query: "旧观点" })).includes(removed.id));
		const current = store.recall(scope, { query: "新观点", kind: "episode" }).items[0] as {
			excerpt: string;
		};
		assert.ok(current.excerpt.includes("新观点"));
		assert.ok(!current.excerpt.includes("旧观点"));
		await store.index(scope, {});
		erase(store, source.id);
		assert.equal(store.status(scope).retrieval.chunks, 0);
		assert.deepEqual(ids(await store.recallAsync(scope, { query: "原文" })), []);
	} finally {
		release();
		store.close();
	}
});

test("deletion while embedding a query is awaiting network is rechecked before returning results", async () => {
	const provider = new FixtureProvider();
	const store = new MaterialStore(":memory:", undefined, provider);
	try {
		const source = store.submit("client", scope, material("a", "自行车")).material;
		await store.index(scope, {});
		let release!: (value: { vectors: number[][]; tokens: number }) => void;
		provider.embed = () =>
			new Promise((resolve) => {
				release = resolve;
			});
		const recall = store.recallAsync(scope, { query: "脚踏出游" });
		erase(store, source.id);
		release({ vectors: [[1, 0]], tokens: 1 });
		assert.deepEqual(ids(await recall), []);
	} finally {
		store.close();
	}
});

test("v2 migration preserves authority and tombstones, backfills only live current revisions, and rolls back failure", () => {
	const dir = mkdtempSync(join(tmpdir(), "rag-migrate-"));
	const path = join(dir, "memory.db");
	let store = new MaterialStore(path);
	const live = store.submit("client", scope, material("live", "杭州脚踏出游")).material;
	const gone = store.submit("client", scope, material("gone", "秘密")).material;
	const first = store.organize("client", scope, episode(store, [live.id])).episode;
	store.organize("client", scope, {
		...episode(store, [live.id], "最新观点", "new"),
		id: first.id,
		expected_revision: 1,
	});
	erase(store, gone.id);
	const seq = store.sequence(scope);
	store.close();
	const db = new Database(path);
	const authority = () =>
		[
			"metadata",
			"spaces",
			"materials",
			"operations",
			"episodes",
			"episode_sources",
			"memory_operations",
			"tombstones",
		].map((table) =>
			db
				.prepare(
					`SELECT * FROM ${table}${table === "metadata" ? " WHERE key!='search_version'" : ""} ORDER BY rowid`,
				)
				.all(),
		);
	try {
		// Strip only derived structures: these authoritative tables are unchanged from v2.
		db.exec(
			"DROP TRIGGER search_chunk_deleted; DROP TABLE search_vectors; DROP TABLE search_chunks; DROP TABLE search_fts; DROP TABLE embedding_usage; DELETE FROM metadata WHERE key='search_version'; PRAGMA user_version=2;",
		);
		const before = authority();
		db.exec("CREATE TABLE search_vectors(dummy TEXT);");
		assert.throws(() => new MaterialStore(path));
		assert.equal(db.pragma("user_version", { simple: true }), 2);
		assert.equal(
			db.prepare("SELECT name FROM sqlite_master WHERE name='search_chunks'").get(),
			undefined,
		);
		assert.deepEqual(authority(), before);
		db.exec("DROP TABLE search_vectors;");
		store = new MaterialStore(path);
		assert.equal(db.pragma("user_version", { simple: true }), 3);
		assert.deepEqual(authority(), before);
		assert.equal(store.sequence(scope), seq);
		assert.deepEqual(store.read(scope, live.id).text, live.text);
		assert.equal(
			store.submit("client", scope, material("live", "杭州脚踏出游")).replayed,
			true,
		);
		assert.throws(() => store.read(scope, gone.id), { message: "NOT_FOUND" });
		assert.equal(store.status(scope).retrieval.chunks, 2);
		assert.equal(store.history(scope, first.id).length, 2);
		assert.deepEqual(ids(store.recall(scope, { query: "秘密" })), []);
		assert.ok(ids(store.recall(scope, { query: "杭州" })).includes(live.id));
		assert.equal(
			db.prepare("SELECT COUNT(*) AS n FROM search_vectors").get() &&
				(db.prepare("SELECT COUNT(*) AS n FROM search_vectors").get() as { n: number }).n,
			0,
		);
	} finally {
		store.close();
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});
