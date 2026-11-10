import sharp from "sharp";
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
				args: [resolve("dist/src/mcp-main.js"), path, "--no-webview"],
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
		const photo = await sharp({
			create: { width: 960, height: 640, channels: 3, background: "#336677" },
		})
			.png()
			.toBuffer();
		writeFileSync(join(database + ".inbox", "sample.png"), photo);
		await connect(runtime);
		const args = {
			filename: "sample.png",
			material: {
				operation_id: "photo",
				source_kind: "activity_report",
				speaker: "camera",
				coverage: "收到图片",
				text: "相册中的照片来自摄影社的阿林，他说喜欢记录社团活动。",
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
		const organized = await call("memory_review", {
			operation_id: "episode",
			base_seq: status.snapshot_seq,
			title: "照片",
			summary: "摄影社的阿林分享了他拍摄的活动照片，说他喜欢记录社团活动。",
			source_ids: [source.id],
			beats: [{ text: "收到照片", source_ids: [source.id] }],
			interpretations: [],
			thread: "相册",
			activity_state: "active",
			unknowns: [],
			person_review: {
				name: "阿林",
				identity: "摄影社成员",
			},
		});
		const { episode, person } = organized;
		const people = await call("memory_people", { query: "摄影社" });
		assert.deepEqual(
			people.items.map((p: { id: string }) => p.id),
			[person.id],
		);
		const reflection = {
			operation_id: "reflect-on-photo",
			base_seq: people.snapshot_seq,
			id: person.id,
			expected_revision: person.revision,
			episodes: [{ id: episode.id, revision: episode.revision }],
			impression: "他喜欢记录社团活动。",
		};
		const preview = await call("memory_preview_review", reflection);
		assert.equal(preview.person_review.impression, reflection.impression);
		await call("memory_review", reflection);
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
			const chooser = await fetch(new URL("/choose", login), { headers: { cookie } });
			assert.ok((await chooser.text()).includes("打开当前记忆库"));
			const select = await fetch(new URL("/select?current=1", login), {
				method: "POST",
				headers: { cookie, origin: login.origin },
				redirect: "manual",
			});
			assert.equal(select.status, 303);
			const get = (path: string) => fetch(new URL(path, login), { headers: { cookie } });
			const directory = await (await get("/?tab=people")).text();
			assert.ok(directory.includes("/person/" + person.id));
			const profile = await (await get("/person/" + person.id)).text();
			assert.ok(
				profile.includes("他喜欢记录社团活动。") &&
					profile.includes("/episode/" + episode.id + "?rev=1"),
			);
			const album = await (await get("/?tab=album")).text();
			assert.ok(album.includes("/thumbnail/" + source.id) && album.includes("相册中的照片"));
			const preview = await get("/thumbnail/" + source.id);
			assert.equal(preview.headers.get("content-type"), "image/webp");
			const size = await sharp(Buffer.from(await preview.arrayBuffer())).metadata();
			assert.deepEqual([size.width, size.height], [480, 320]);
			const backlinks = await (await get("/material/" + source.id)).text();
			assert.ok(backlinks.includes("/episode/" + episode.id));
			const results = await (await get("/search?q=" + encodeURIComponent("照片"))).text();
			assert.ok(
				results.includes("/episode/" + episode.id) &&
					results.includes("/material/" + source.id),
			);

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
		assert.ok(
			readFileSync(join(exported, "person-" + person.id + ".md"), "utf8").includes(
				episode.id + "-v1.md",
			),
		);
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
		const restoredPerson = (await call("memory_read", { kind: "person", id: person.id }))
			.profile;
		assert.equal(restoredPerson.current_impression.episodes[0].id, episode.id);
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
}, 15000);
