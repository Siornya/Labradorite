import assert from "node:assert/strict";
import { test } from "vite-plus/test";
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
