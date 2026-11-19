import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { viewerUrl, loginViewer } from "./viewer-session.js";
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { MaterialStore } from "@/storage/materials.js";

test("viewer filters and orders event times before pagination, then cleans up on termination", async () => {
	const dir = mkdtempSync(join(tmpdir(), "viewer-signal-"));
	const runtime = join(dir, "runtime.json");
	const database = join(dir, "memory.db");
	const store = new MaterialStore(database);
	const scope = { space: "local", world: "real", character: "reader" };
	const source = store.submit("client", scope, {
		operation_id: "source",
		text: "一月的日记",
		source_kind: "character_statement",
		speaker: "reader",
		coverage: "日记",
	}).material;
	const ids = new Map<number, string>();
	for (let day = 31; day >= 0; day--) {
		const episode = store.reviewEpisode("client", scope, {
			operation_id: `day-${day}`,
			base_seq: store.sequence(scope),
			title: `日记-${day}`,
			summary: "日记",
			source_ids: [source.id],
			beats: [{ text: "当天的事", source_ids: [source.id] }],
			interpretations: [],
			thread: null,
			activity_state: "completed",
			unknowns: [],
			...(day
				? {
						happen: {
							kind: "point",
							start: {
								value: `2026-01-${String(day).padStart(2, "0")}`,
								precision: "day",
							},
							utc_offset: "+08:00",
							basis: "stated",
							source_ids: [source.id],
						},
					}
				: {}),
		}).episode;
		ids.set(day, episode.id);
	}
	store.close();
	writeFileSync(
		runtime,
		JSON.stringify({ database, space: "local", world: "real", character: "reader" }),
	);
	// Windows does not deliver POSIX SIGTERM; emit the same Node event there.
	const bootstrap = `
		process.argv = [process.execPath, "viewer", process.argv[1], "0"];
		process.on("message", () => process.emit("SIGTERM"));
		await import(${JSON.stringify(pathToFileURL(resolve("dist/src/viewer.js")).href)});
	`;
	const child = spawn(process.execPath, ["--input-type=module", "-e", bootstrap, runtime], {
		env: { ...process.env, HOME: dir, USERPROFILE: dir },
		stdio: ["ignore", "pipe", "pipe", "ipc"],
		windowsHide: true,
	});
	const closed = once(child, "close");
	const timer = setTimeout(() => child.kill("SIGKILL"), 8000);
	try {
		const url = await viewerUrl(child.stdout!);
		const session = await loginViewer(url);
		await session.select();
		const get = async (path: string) => (await session.get(path)).text();
		const first = await get("/?tab=episodes");
		assert.ok(first.includes(ids.get(31)!) && first.includes(ids.get(30)!));
		assert.ok(first.indexOf(ids.get(31)!) < first.indexOf(ids.get(30)!));
		assert.ok(
			first.includes(ids.get(2)!) &&
				!first.includes(ids.get(1)!) &&
				!first.includes(ids.get(0)!),
		);
		const second = await get("/?tab=episodes&page=1");
		assert.ok(
			second.includes(ids.get(1)!) &&
				second.indexOf(ids.get(1)!) < second.indexOf(ids.get(0)!),
		);
		const unknown = await get("/?tab=episodes&unknown=1");
		assert.ok(unknown.includes(ids.get(0)!) && !unknown.includes(ids.get(1)!));
		const recorded = await get("/?tab=episodes&time_basis=review");
		assert.ok(recorded.includes(ids.get(0)!) && recorded.includes(ids.get(1)!));
		assert.ok(recorded.indexOf(ids.get(0)!) < recorded.indexOf(ids.get(1)!));
		const window = new URLSearchParams({
			tab: "episodes",
			from: "2026-01-01T00:00:00+08:00",
			to: "2026-01-31T23:59:59.999+08:00",
		});
		const filtered = await get("/?" + window);
		const next = /href="([^" ]+)">下一页/.exec(filtered);
		assert.ok(next);
		const last = await get(next[1]!.replaceAll("&amp;", "&"));
		assert.ok(last.includes(ids.get(1)!) && !last.includes(ids.get(0)!));
		const log = await get("/reviews");
		const record = /href="(\/reviews\/[a-f0-9]{64})"/.exec(log)![1]!;
		assert.match(log, /待审阅/);
		const review = await get(record);
		assert.match(review, /一月的日记/);
		const selection = /name="selection" value="([^"]+)"/.exec(review)![1]!;
		const post = (action: string, origin = url.origin, selected = selection) =>
			session.post(record, new URLSearchParams({ action, selection: selected }), origin);
		assert.equal((await post("undo", "https://example.invalid")).status, 403);
		assert.equal((await post("undo", undefined, "stale")).status, 409);
		assert.equal((await post("check")).status, 303);
		assert.match(await get(record), /已审阅/);
		assert.equal((await post("undo")).status, 303);
		assert.match(await get(record), /已撤销/);
		assert.equal((await session.get("/episode/" + ids.get(0))).status, 404);
		assert.match(await get("/material/" + source.id), /一月的日记/);
		if (process.platform === "win32") child.send("terminate");
		else child.kill("SIGTERM");
		const [code] = await closed;
		assert.equal(code, 143);
		assert.deepEqual(readdirSync(join(dir, ".labradorite", "viewers")), []);
		await assert.rejects(fetch(url));
	} finally {
		clearTimeout(timer);
		child.kill("SIGKILL");
		await closed;
		rmSync(dir, { recursive: true, force: true });
	}
}, 10000);

test("service starts a headless viewer by default and closes it with the MCP transport", async () => {
	const dir = mkdtempSync(join(tmpdir(), "managed-viewer-"));
	const runtime = join(dir, "runtime.json");
	writeFileSync(
		runtime,
		JSON.stringify({
			database: join(dir, "memory.db"),
			space: "local",
			world: "real",
			character: "reader",
		}),
	);
	const child = spawn(process.execPath, [resolve("dist/src/mcp-main.js"), runtime], {
		env: { ...process.env, SSH_CONNECTION: "test", HOME: dir, USERPROFILE: dir },
		windowsHide: true,
	});
	const closed = once(child, "close");
	const login = viewerUrl(child.stderr);
	let protocol = "";
	child.stdout.on("data", (chunk) => {
		protocol += chunk;
	});
	const timer = setTimeout(() => child.kill(), 8000);
	try {
		const url = await login;
		const cli = execFileSync(
			process.execPath,
			[resolve("node_modules/vite-plus/bin/vpx"), resolve("scripts/viewer-url.js")],
			{
				encoding: "utf8",
				env: { ...process.env, HOME: dir, USERPROFILE: dir },
			},
		);
		assert.ok(cli.includes(url.href) && cli.includes("ssh -N -L"));
		assert.equal((await fetch(url, { redirect: "manual" })).status, 303);
		child.stdin.end();
		await closed;
		assert.equal(protocol, "");
		await assert.rejects(fetch(url));
	} finally {
		clearTimeout(timer);
		child.kill();
		await closed;
		rmSync(dir, { recursive: true, force: true });
	}
}, 10000);
