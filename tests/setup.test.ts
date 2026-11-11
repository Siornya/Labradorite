import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import { loadRuntimeConfig } from "@/runtime-config.js";
test("setup discovers dimensions from a real request and keeps the working provider after a failed switch", async () => {
	const dir = mkdtempSync(join(tmpdir(), "labradorite-provider-"));
	const service = createServer(async (req, res) => {
		const parts: Buffer[] = [];
		for await (const chunk of req) parts.push(Buffer.from(chunk));
		const body = JSON.parse(Buffer.concat(parts).toString());
		res.setHeader("content-type", "application/json");
		res.end(
			JSON.stringify({
				model: "fixture",
				data: body.input.map((_: string, index: number) => ({
					index,
					embedding: [1, 2, 3],
				})),
			}),
		);
	});
	try {
		service.listen(0, "127.0.0.1");
		await once(service, "listening");
		const address = service.address();
		assert.ok(address && typeof address !== "string");
		const setup = (...args: string[]) =>
			promisify(execFile)(process.execPath, [
				resolve("node_modules/vite-plus/bin/vpx"),
				resolve("scripts/setup.ts"),
				dir,
				...args,
			]);
		const options = [
			"--embedding",
			"external",
			"--endpoint",
			"http://127.0.0.1:" + address.port + "/v1/embeddings",
			"--model",
		];
		await setup(...options, "fixture");
		const path = join(dir, "runtime.json");
		const saved = loadRuntimeConfig(path);
		assert.equal(saved.embedding?.dimensions, 3);
		await assert.rejects(
			setup("--embedding", "ollama", "--model", "fixture"),
			/未知的 embedding 模式/,
		);
		assert.deepEqual(loadRuntimeConfig(path), saved);
		await assert.rejects(setup(...options, "wrong-model"));
		assert.deepEqual(loadRuntimeConfig(path), saved);
		await setup("--embedding", "lexical");
		assert.equal(loadRuntimeConfig(path).embedding, undefined);
	} finally {
		service.closeAllConnections();
		await new Promise<void>((done) => service.close(() => done()));
		rmSync(dir, { recursive: true, force: true });
	}
});

test("setup produces private runtime and usable stdio configuration without changing existing settings", () => {
	const dir = mkdtempSync(join(tmpdir(), "labradorite-setup-"));
	try {
		const run = () =>
			spawnSync(
				process.execPath,
				[resolve("node_modules/vite-plus/bin/vpx"), resolve("scripts/setup.ts"), dir],
				{
					encoding: "utf8",
				},
			);
		const first = run();
		assert.equal(first.status, 0, first.stderr);
		const path = join(dir, "runtime.json");
		const config = loadRuntimeConfig(path);
		const mcp = JSON.parse(readFileSync(join(dir, "mcp.json"), "utf8")).mcpServers.Labradorite;
		assert.equal(mcp.command, process.execPath);
		assert.ok(isAbsolute(mcp.args[0]));
		assert.equal(mcp.args[1], path);
		assert.equal(run().status, 0);
		assert.deepEqual(loadRuntimeConfig(path), config);
		const embedding = {
			endpoint: "https://example.invalid/v1/embeddings",
			model: "configured",
			dimensions: 2,
			max_requests_per_day: 0,
			timeout_ms: 1000,
		};
		writeFileSync(path, JSON.stringify({ ...config, embedding }));
		assert.equal(run().status, 0);
		assert.deepEqual(loadRuntimeConfig(path).embedding, embedding);
		writeFileSync(
			path,
			JSON.stringify({ ...config, embedding: { ...embedding, api_key: "not-permitted" } }),
		);
		assert.throws(() => loadRuntimeConfig(path), /EMBEDDING_CONFIG/);
		writeFileSync(path, JSON.stringify({ ...config, token: "obsolete" }));
		assert.throws(() => loadRuntimeConfig(path), /Unknown/);
		writeFileSync(path, JSON.stringify({ ...config, database: "relative.db" }));
		assert.throws(() => loadRuntimeConfig(path), /absolute/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
