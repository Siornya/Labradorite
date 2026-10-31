import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createDaemon, DAEMON_PORT, requireToken } from "../src/transport/daemon.js";
import { MaterialStore } from "../src/storage/materials.js";

test("daemon rejects missing credentials and browser origins", async () => {
	assert.throws(() => requireToken("short"));
	const token = "a".repeat(32);
	const daemon = createDaemon(token);
	try {
		assert.equal((await daemon.inject({ url: "/health/live" })).statusCode, 401);
		assert.equal(
			(
				await daemon.inject({
					url: "/health/live",
					headers: { authorization: `Bearer ${token}`, origin: "https://example.com" },
				})
			).statusCode,
			401,
		);
		assert.equal(
			(
				await daemon.inject({
					url: "/health/live",
					headers: { authorization: `Bearer ${token}` },
				})
			).statusCode,
			200,
		);
	} finally {
		await daemon.close();
	}
});

test("model submits and reads original material through stdio MCP", async () => {
	const token = "d".repeat(32);
	const daemon = createDaemon(token, {
		store: new MaterialStore(":memory:"),
		scope: { space: "test", character: "writer", world: "real" },
		principal: "client",
	});
	const client = new Client({ name: "material-client", version: "1" });
	try {
		await daemon.listen({ host: "127.0.0.1", port: DAEMON_PORT });
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: [resolve("dist/src/mcp-main.js")],
				env: { FISH_MEMORY_TOKEN: token },
				stderr: "pipe",
			}),
		);
		const args = {
			operation_id: "mcp-1",
			text: "尝试改写主歌，尚未完成。",
			source_kind: "character_statement",
			speaker: "writer",
			coverage: "本次创作尝试的自述",
		};
		const submitted = await client.callTool({ name: "memory_submit", arguments: args });
		assert.equal(submitted.isError, false);
		const content = submitted.content as { type: string; text: string }[];
		const receipt = JSON.parse(content[0]!.text);
		const read = await client.callTool({
			name: "memory_read",
			arguments: { id: receipt.material.id },
		});
		assert.equal(read.isError, false);
		assert.equal(JSON.parse((read.content as { text: string }[])[0]!.text).text, args.text);
		const conflict = await client.callTool({
			name: "memory_submit",
			arguments: { ...args, text: "完成" },
		});
		assert.equal(conflict.isError, true);
		const unpack = (value: Record<string, unknown>) =>
			JSON.parse((value.content as { text: string }[])[0]!.text);
		const recalled = unpack(
			await client.callTool({ name: "memory_recall", arguments: { query: "主歌" } }),
		);
		assert.ok(recalled.items.length > 0);
		const organized = await client.callTool({
			name: "memory_organize",
			arguments: {
				operation_id: "organize-mcp",
				base_seq: recalled.snapshot_seq,
				title: "主歌创作",
				summary: "尝试修改主歌，但尚未完成。",
				source_ids: [receipt.material.id],
				beats: [{ text: "开始尝试改写。", source_ids: [receipt.material.id] }],
				interpretations: [],
				thread: "歌曲",
				activity_state: "active",
				unknowns: ["后续进展未知"],
			},
		});
		assert.equal(organized.isError, false);
		const ep = unpack(organized).episode;
		const history = unpack(
			await client.callTool({
				name: "memory_read",
				arguments: { id: ep.id, kind: "episode" },
			}),
		);
		assert.equal(history.history.length, 1);
		const deleted = await client.callTool({
			name: "memory_delete",
			arguments: { operation_id: "delete-mcp", source_ids: [receipt.material.id] },
		});
		assert.equal(deleted.isError, false);
		assert.equal(
			(
				await client.callTool({
					name: "memory_read",
					arguments: { id: ep.id, kind: "episode" },
				})
			).isError,
			true,
		);
		assert.equal(
			unpack(await client.callTool({ name: "memory_recall", arguments: { query: "主歌" } }))
				.items.length,
			0,
		);
	} finally {
		await client.close();
		await daemon.close();
	}
});

test("stdio clients share one daemon and duplicate daemon cannot bind", async () => {
	const token = "b".repeat(32);
	const daemon = createDaemon(token);
	const duplicate = createDaemon(token);
	const clients: Client[] = [];
	try {
		await daemon.listen({ host: "127.0.0.1", port: DAEMON_PORT });
		await assert.rejects(duplicate.listen({ host: "127.0.0.1", port: DAEMON_PORT }), {
			code: "EADDRINUSE",
		});
		for (let i = 0; i < 2; i++) {
			const client = new Client({ name: "integration-test", version: "1" });
			clients.push(client);
			await client.connect(
				new StdioClientTransport({
					command: process.execPath,
					args: [resolve("dist/src/mcp-main.js")],
					env: { FISH_MEMORY_TOKEN: token },
					stderr: "pipe",
				}),
			);
			assert.deepEqual(
				(await client.listTools()).tools.map((tool) => tool.name),
				[
					"memory_recall",
					"memory_organize",
					"memory_delete",
					"memory_status",
					"memory_submit",
					"memory_read",
				],
			);
			const result = await client.callTool({ name: "memory_status", arguments: {} });
			assert.equal(result.isError, true);
			assert.deepEqual(result.content, [
				{ type: "text", text: "memory_capabilities_not_implemented" },
			]);
		}
		await daemon.close();
		const result = await clients[0]!.callTool({ name: "memory_status", arguments: {} });
		assert.deepEqual(result.content, [{ type: "text", text: "headless_service_unavailable" }]);
	} finally {
		await Promise.all(clients.map((client) => client.close()));
		await duplicate.close();
		await daemon.close();
	}
});
