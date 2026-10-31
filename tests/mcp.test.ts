import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("model submits and reads original material through stdio MCP", async () => {
	const directory = mkdtempSync(join(tmpdir(), "fish-mcp-"));
	const config = join(directory, "runtime.json");
	writeFileSync(
		config,
		JSON.stringify({
			database: join(directory, "memory.db"),
			space: "test",
			character: "writer",
			world: "real",
		}),
	);
	const client = new Client({ name: "material-client", version: "1" });
	try {
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: [resolve("dist/src/mcp-main.js"), config],
				stderr: "pipe",
			}),
		);
		assert.equal((await client.listTools()).tools.length, 10);
		assert.equal(
			(await client.callTool({ name: "memory_status", arguments: {} })).isError,
			false,
		);
		for (const call of [
			{ name: "memory_status", arguments: { extra: true } },
			{ name: "memory_read", arguments: { id: "x", kind: "invalid" } },
			{ name: "memory_recall", arguments: { query: "x", limit: "2" } },
			{ name: "memory_submit", arguments: { text: "private-invalid-payload" } },
		]) {
			const error = await client.callTool(call);
			assert.equal(error.isError, true);
			assert.ok(!JSON.stringify(error).includes("private-invalid-payload"));
		}
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
		await client.close();
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: [resolve("dist/src/mcp-main.js"), config],
				stderr: "pipe",
			}),
		);
		const persisted = await client.callTool({
			name: "memory_read",
			arguments: { id: receipt.material.id },
		});
		assert.equal(persisted.isError, false);
		assert.equal(
			JSON.parse((persisted.content as { text: string }[])[0]!.text).text,
			args.text,
		);
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
		const current = unpack(await client.callTool({ name: "memory_status", arguments: {} }));
		assert.equal(current.counts.organized, 1);
		assert.equal(current.counts.pending, 0);
		const amendment = {
			operation_id: "amend-mcp",
			base_seq: current.snapshot_seq,
			id: ep.id,
			expected_revision: 1,
			append_unknowns: ["仍未试听"],
		};
		const delta = await client.callTool({
			name: "memory_amend",
			arguments: { ...amendment, dry_run: true },
		});
		assert.equal(delta.isError, false);
		assert.equal(unpack(delta).changes[0].field, "unknowns");
		const fields = Object.fromEntries(
			Object.entries(ep).filter(([key]) =>
				[
					"title",
					"summary",
					"source_ids",
					"beats",
					"interpretations",
					"thread",
					"activity_state",
					"unknowns",
				].includes(key),
			),
		);
		assert.equal(
			(
				await client.callTool({
					name: "memory_preview_organize",
					arguments: {
						...fields,
						operation_id: "preview-mcp",
						base_seq: current.snapshot_seq,
					},
				})
			).isError,
			false,
		);
		assert.equal(
			(await client.callTool({ name: "memory_amend", arguments: amendment })).isError,
			false,
		);

		const history = unpack(
			await client.callTool({
				name: "memory_read",
				arguments: { id: ep.id, kind: "episode" },
			}),
		);
		assert.equal(history.history.length, 2);
		const preview = unpack(
			await client.callTool({
				name: "memory_preview_delete",
				arguments: { source_ids: [receipt.material.id] },
			}),
		);
		const deleted = await client.callTool({
			name: "memory_delete",
			arguments: {
				operation_id: "delete-mcp",
				source_ids: [receipt.material.id],
				preview_token: preview.preview_token,
			},
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
		rmSync(directory, { recursive: true, force: true });
	}
});
