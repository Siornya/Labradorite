import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("stdio MCP indexes through compatible HTTP embeddings and returns source-backed semantic recall", async () => {
	const directory = mkdtempSync(join(tmpdir(), "hybrid-mcp-"));
	const inputs: string[][] = [];
	const endpoint = createServer(async (req, res) => {
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const body = JSON.parse(Buffer.concat(chunks).toString()) as {
			input: string[];
			model: string;
			dimensions: number;
		};
		inputs.push(body.input);
		if (
			req.method !== "POST" ||
			req.url !== "/v1/embeddings" ||
			body.model !== "fixture" ||
			body.dimensions !== 2
		) {
			res.writeHead(400).end();
			return;
		}
		res.setHeader("Content-Type", "application/json");
		res.end(
			JSON.stringify({
				model: "fixture",
				data: body.input.map((text, index) => ({
					index,
					embedding: /自行车|脚踏出游/.test(text) ? [1, 0] : [0, 1],
				})),
				usage: { total_tokens: body.input.length },
			}),
		);
	});
	const client = new Client({ name: "hybrid-integration", version: "0.0.0" });
	try {
		endpoint.listen(0, "127.0.0.1");
		await once(endpoint, "listening");
		const address = endpoint.address();
		assert.ok(address && typeof address !== "string");
		const path = join(directory, "runtime.json");
		writeFileSync(
			path,
			JSON.stringify({
				database: join(directory, "memory.db"),
				space: "test",
				character: "reader",
				world: "real",
				embedding: {
					endpoint: `http://127.0.0.1:${address.port}/v1/embeddings`,
					model: "fixture",
					dimensions: 2,
					request_dimensions: true,
					max_requests_per_day: 10,
					timeout_ms: 2000,
				},
			}),
		);
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: [resolve("dist/src/mcp-main.js"), path],
				stderr: "pipe",
			}),
		);
		const call = async (name: string, args: Record<string, unknown>) => {
			const result = await client.callTool({ name, arguments: args });
			assert.equal(result.isError, false, JSON.stringify(result));
			return JSON.parse((result.content as { text: string }[])[0]!.text);
		};
		const receipt = await call("memory_submit", {
			operation_id: "bike",
			text: "今天买了一辆自行车。",
			source_kind: "activity_report",
			speaker: "reader",
			coverage: "synthetic activity",
		});
		assert.equal(inputs.length, 0);
		const index = await call("memory_index", { max_batches: 1 });
		assert.equal(index.indexed_chunks, 1, JSON.stringify({ index, inputs }));
		assert.deepEqual(inputs[0], [receipt.material.text]);
		const recall = await call("memory_recall", { query: "脚踏出游" });
		assert.equal(recall.items[0].id, receipt.material.id);
		assert.equal(recall.items[0].match_reason, "semantic_similarity");
		assert.equal(recall.context_role, "historical_background");
		assert.equal(
			(await call("memory_read", { id: receipt.material.id })).text,
			receipt.material.text,
		);
		assert.deepEqual(
			(await call("memory_recall", { query: "脚踏出游", mode: "lexical" })).items,
			[],
		);
		assert.equal(inputs.length, 2);
		const preview = await call("memory_preview_delete", { source_ids: [receipt.material.id] });
		await call("memory_delete", {
			operation_id: "erase",
			source_ids: [receipt.material.id],
			preview_token: preview.preview_token,
		});
		assert.equal((await call("memory_status", {})).retrieval.chunks, 0);
		assert.deepEqual((await call("memory_recall", { query: "脚踏出游" })).items, []);
		assert.equal(inputs.length, 2);
	} finally {
		await client.close();
		endpoint.closeAllConnections();
		await new Promise<void>((resolve) => endpoint.close(() => resolve()));
		rmSync(directory, { recursive: true, force: true });
	}
});
