import assert from "node:assert/strict";
import test from "node:test";
import { ManualClock } from "../src/domain/clock.js";
import { readSourceSpan } from "../src/domain/source-span.js";
import { createApp } from "../src/transport/app.js";
import { publicCode, publicError } from "../src/transport/errors.js";

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

test("health distinguishes live process from unimplemented memory capabilities", async () => {
	const app = createApp({ clock: { now: () => new Date("2026-10-31T00:00:00Z") } });
	try {
		const live = await app.inject({ method: "GET", url: "/health/live" });
		assert.equal(live.statusCode, 200);
		assert.equal(live.json().checked_at, "2026-10-31T00:00:00.000Z");
		const ready = await app.inject({ method: "GET", url: "/health/ready" });
		assert.equal(ready.statusCode, 503);
		assert.equal(ready.json().code, "UNAVAILABLE");
		const missing = await app.inject({
			method: "GET",
			url: "/private-secret",
			headers: { "x-request-id": "untrusted-id" },
		});
		assert.equal(missing.statusCode, 404);
		assert.notEqual(missing.json().request_id, "untrusted-id");
		assert.ok(!missing.body.includes("private-secret"));
	} finally {
		await app.close();
	}
});

test("public errors do not disclose internal exception contents", () => {
	const code = publicCode(new Error("secret-api-key and private material"));
	assert.equal(code, "INTERNAL_ERROR");
	assert.ok(!JSON.stringify(publicError(code, "request-1")).includes("secret"));
});

test("contract validation rejects coercion, extra fields, malformed and oversized bodies", async () => {
	const app = createApp();
	app.post(
		"/test/span",
		{
			schema: { body: { $ref: "urn:fish-memory:source-span:v1#" } },
		},
		async () => ({ accepted: true }),
	);
	try {
		for (const payload of [
			{ start: "0", end: 1 },
			{ start: 0, end: 1, secret: "private" },
		]) {
			const response = await app.inject({ method: "POST", url: "/test/span", payload });
			assert.equal(response.statusCode, 400);
			assert.equal(response.json().code, "VALIDATION_ERROR");
			assert.ok(!response.body.includes("private"));
		}
		const malformed = await app.inject({
			method: "POST",
			url: "/test/span",
			headers: { "content-type": "application/json" },
			payload: "{private",
		});
		assert.equal(malformed.statusCode, 400);
		assert.ok(!malformed.body.includes("private"));
		const oversized = await app.inject({
			method: "POST",
			url: "/test/span",
			payload: { text: "x".repeat(256 * 1024) },
		});
		assert.equal(oversized.statusCode, 413);
		assert.equal(oversized.json().code, "PAYLOAD_TOO_LARGE");
	} finally {
		await app.close();
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
