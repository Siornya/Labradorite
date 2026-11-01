import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import {
	CompatibleEmbeddingProvider,
	validateEmbeddingConfig,
} from "../src/providers/embedding.js";
const config = {
	endpoint: "https://example.invalid/v1/embeddings",
	model: "test-model",
	dimensions: 2,
	max_requests_per_day: 20,
	timeout_ms: 1000,
};

test("compatible embedding adapter validates order dimensions and normalizes returned vectors", async () => {
	let calls = 0;
	const provider = new CompatibleEmbeddingProvider(config, async (url, options) => {
		calls++;
		assert.equal(url, config.endpoint);
		assert.equal(options?.redirect, "error");
		assert.deepEqual(JSON.parse(options?.body as string), {
			model: "test-model",
			input: ["first", "second"],
			encoding_format: "float",
		});
		return Response.json({
			model: "test-model",
			data: [
				{ index: 1, embedding: [0, 3] },
				{ index: 0, embedding: [3, 4] },
			],
			usage: { total_tokens: 4 },
		});
	});
	assert.deepEqual(await provider.embed(["first", "second"]), {
		vectors: [
			[0.6, 0.8],
			[0, 1],
		],
		tokens: 4,
	});
	assert.equal(calls, 1);
});

test("embedding failures do not expose provider errors or mix incompatible vector spaces", async () => {
	for (const data of [
		{ model: "different-model", data: [{ index: 0, embedding: [1, 0] }] },
		{ model: "test-model", data: [{ index: 0, embedding: [1, 0, 0] }] },
		{ model: "test-model", data: [{ index: 1, embedding: [1, 0] }] },
		{ model: "test-model", data: [{ index: 0, embedding: [0, 0] }] },
	]) {
		const provider = new CompatibleEmbeddingProvider(config, async () => Response.json(data));
		await assert.rejects(provider.embed(["synthetic"]));
	}
	const provider = new CompatibleEmbeddingProvider(
		config,
		async () => new Response("secret-provider-error", { status: 500 }),
	);
	await assert.rejects(provider.embed(["synthetic"]), { message: "EMBEDDING_UNAVAILABLE" });
});

test("embedding configuration is explicit and rejects insecure endpoints and unbounded input", async () => {
	for (const invalid of [
		{ ...config, endpoint: "http://example.com/embeddings" },
		{ ...config, dimensions: 0 },
		{ ...config, max_requests_per_day: -1 },
		{ ...config, token: "secret" },
	])
		assert.throws(() => validateEmbeddingConfig(invalid));
	assert.equal(
		validateEmbeddingConfig({ ...config, endpoint: "http://127.0.0.1:8000/v1/embeddings" })
			.dimensions,
		2,
	);
	let called = false;
	const provider = new CompatibleEmbeddingProvider(config, async () => {
		called = true;
		return Response.json({});
	});
	await assert.rejects(provider.embed([""]), { message: "EMBEDDING_INPUT" });
	await assert.rejects(provider.embed(["x".repeat(16001)]), { message: "EMBEDDING_INPUT" });
	assert.equal(called, false);
});
