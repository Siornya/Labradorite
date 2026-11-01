import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import Database from "better-sqlite3";
import {
	analyze,
	indexText,
	matchExpression,
	reciprocalRankFusion,
	normalizeVector,
	cosineNormalized,
} from "../src/retrieval/algorithms.js";

test("versioned Chinese analyzer preserves short names emoji and safe FTS expressions", () => {
	assert.deepEqual(analyze("小王读📖 ＡＩ2026"), [
		"小",
		"小王",
		"王",
		"王读",
		"读",
		"📖",
		"ai2026",
	]);
	const db = new Database(":memory:");
	try {
		db.exec("CREATE VIRTUAL TABLE search USING fts5(id UNINDEXED, tokens)");
		db.prepare("INSERT INTO search VALUES (?,?)").run("one", indexText("小王在杭州读📖"));
		for (const q of ["小王", "杭州", "📖"])
			assert.equal(
				(
					db
						.prepare("SELECT id FROM search WHERE search MATCH ?")
						.get(matchExpression(q)) as { id: string }
				).id,
				"one",
			);
		assert.doesNotThrow(() =>
			db
				.prepare("SELECT id FROM search WHERE search MATCH ?")
				.all(matchExpression('" OR tokens:* NOT 小王')),
		);
		assert.equal(matchExpression("[]:*"), null);
	} finally {
		db.close();
	}
});

test("equal-weight RRF combines ranks without double-counting duplicates", () => {
	const result = reciprocalRankFusion([
		["a", "b", "b"],
		["b", "c"],
	]);
	assert.equal(result[0]!.id, "b");
	assert.equal(result[0]!.score, 1 / 62 + 1 / 61);
	assert.deepEqual(
		reciprocalRankFusion([["b"], ["a"]]).map((x) => x.id),
		["a", "b"],
	);
});

test("embedding vectors validate dimensions finite values and stable unit normalization", () => {
	assert.deepEqual(normalizeVector([3, 4], 2), [0.6, 0.8]);
	assert.ok(
		Math.abs(
			cosineNormalized(normalizeVector([1e308, 1e308], 2), normalizeVector([1, 1], 2)) - 1,
		) < 1e-12,
	);
	for (const vector of [[0, 0], [1], [1, Infinity], ["1", 2]])
		assert.throws(() => normalizeVector(vector, 2));
	assert.throws(() => cosineNormalized([1], [1, 2]));
});
