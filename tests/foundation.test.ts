import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { ManualClock } from "../src/domain/clock.js";
import { readSourceSpan } from "../src/domain/source-span.js";

test("source spans preserve Chinese, emoji and combining marks", () => {
	const text = "我📖读e\u0301第二章";
	assert.equal(readSourceSpan(text, { start: 1, end: 2 }), "📖");
	assert.equal(readSourceSpan(text, { start: 3, end: 5 }), "e\u0301");
	assert.equal(readSourceSpan(text, { start: 5, end: 8 }), "第二章");
	for (const span of [
		{ start: -1, end: 1 },
		{ start: 0, end: 99 },
		{ start: 2, end: 2 },
		{ start: 0.5, end: 2 },
	]) {
		assert.throws(() => readSourceSpan(text, span), RangeError);
	}
});

test("manual clock isolates returned dates and rejects invalid advancement", () => {
	const clock = new ManualClock("2026-10-31T00:00:00Z");
	clock.now().setFullYear(2000);
	assert.equal(clock.now().getUTCFullYear(), 2026);
	clock.advanceBy(1000);
	assert.equal(clock.now().toISOString(), "2026-10-31T00:00:01.000Z");
	assert.throws(() => clock.advanceBy(-1), RangeError);
	assert.throws(() => new ManualClock("invalid"), RangeError);
});
