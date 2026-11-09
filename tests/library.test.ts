import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP album, Markdown export and restored instance retain the original media and episode sources", async () => {
	const root = mkdtempSync(join(tmpdir(), "memory-album-"));
	let client = new Client({ name: "album", version: "1" });
	const connect = async (path: string) =>
		client.connect(
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
	const cli = (...args: string[]) =>
		execFileSync(process.execPath, [resolve("dist/src/library.js"), ...args]);
	try {
		execFileSync(process.execPath, [resolve("dist/src/setup.js"), root]);
		const runtime = join(root, "runtime.json");
		const database = JSON.parse(readFileSync(runtime, "utf8")).database;
		const photo = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
			"base64",
		);
		writeFileSync(join(database + ".inbox", "sample.png"), photo);
		await connect(runtime);
		const args = {
			filename: "sample.png",
			material: {
				operation_id: "photo",
				source_kind: "activity_report",
				speaker: "camera",
				coverage: "收到图片",
				text: "相册中的照片",
			},
		};
		const source = (await call("memory_import_media", args)).material;
		assert.equal((await call("memory_import_media", args)).material.id, source.id);
		assert.equal(
			(
				await client.callTool({
					name: "memory_import_media",
					arguments: { ...args, filename: "../runtime.json" },
				})
			).isError,
			true,
		);
		const status = await call("memory_status", {});
		const episode = (
			await call("memory_organize", {
				operation_id: "episode",
				base_seq: status.snapshot_seq,
				title: "照片",
				summary: "收到照片",
				source_ids: [source.id],
				beats: [{ text: "收到照片", source_ids: [source.id] }],
				interpretations: [],
				thread: "相册",
				activity_state: "active",
				unknowns: [],
			})
		).episode;
		writeFileSync(
			join(database + ".inbox", "clip.mp4"),
			Buffer.from("000000186674797069736f6d0000000069736f6d6d703431", "hex"),
		);
		const clip = {
			filename: "clip.mp4",
			material: { ...args.material, operation_id: "clip", coverage: "仅处理 1 至 2 秒" },
			observed_range_ms: [1000, 2000],
		};
		assert.equal(
			(
				await client.callTool({
					name: "memory_import_media",
					arguments: { ...clip, observed_range_ms: [2000, 1000] },
				})
			).isError,
			true,
		);
		const video = (await call("memory_import_media", clip)).material;
		assert.deepEqual(video.media.observed_range_ms, [1000, 2000]);
		const viewer = spawn(process.execPath, [resolve("dist/src/viewer.js"), runtime, "0"], {
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
		const closed = once(viewer, "exit");
		try {
			const [startup] = await once(viewer.stdout, "data");
			const login = new URL(String(startup).trim());
			assert.equal((await fetch(login.origin)).status, 403);
			const ticket = await fetch(login, { redirect: "manual" });
			const cookie = ticket.headers.get("set-cookie")!.split(";")[0]!;
			const get = (path: string) => fetch(new URL(path, login), { headers: { cookie } });
			assert.ok((await (await get("/?tab=album")).text()).includes("sample.png"));
			assert.ok(
				(await (await get("/episode/" + episode.id)).text()).includes(
					"/material/" + source.id,
				),
			);
			assert.deepEqual(
				Buffer.from(await (await get("/media/" + source.id)).arrayBuffer()),
				photo,
			);
			const partial = await fetch(new URL("/media/" + video.id, login), {
				headers: { cookie, range: "bytes=4-7" },
			});
			assert.equal(partial.status, 206);
			assert.equal(await partial.text(), "ftyp");
			assert.equal(
				(await fetch(login.origin, { method: "POST", headers: { cookie } })).status,
				405,
			);
		} finally {
			viewer.kill();
			await closed;
		}
		const exported = join(root, "export");
		cli("markdown", runtime, exported);
		assert.ok(readFileSync(join(exported, "Album.md"), "utf8").includes(source.media.file));
		assert.ok(
			readFileSync(join(exported, episode.id + "-v1.md"), "utf8").includes(source.id + ".md"),
		);
		const backup = join(root, "backup"),
			restored = join(root, "restored");
		cli("backup", runtime, backup);
		cli("restore", backup, restored);
		await client.close();
		client = new Client({ name: "restored", version: "1" });
		await connect(join(restored, "runtime.json"));
		assert.deepEqual(
			(await call("memory_album", {})).items.map((item: { id: string }) => item.id),
			[video.id, source.id],
		);
		assert.deepEqual(
			(await call("memory_read", { id: episode.id, kind: "episode" })).episode.source_ids,
			[source.id],
		);
		assert.deepEqual(readFileSync(join(restored, "memory.db.media", source.media.file)), photo);
	} finally {
		await client.close();
		rmSync(root, { recursive: true, force: true });
	}
});
