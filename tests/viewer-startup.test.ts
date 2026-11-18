import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";
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
	const lines = createInterface({ input: child.stdout! });
	const timer = setTimeout(() => child.kill("SIGKILL"), 8000);
	try {
		let url = "";
		for await (const line of lines) {
			if (line.startsWith("http://127.0.0.1:")) {
				url = line;
				break;
			}
		}
		assert.ok(url);
		const login = await fetch(url, { redirect: "manual" });
		const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
		const selected = await fetch(new URL("/select?current=1", url), {
			method: "POST",
			redirect: "manual",
			headers: { cookie, origin: new URL(url).origin },
		});
		assert.equal(selected.status, 303);
		const get = async (path: string) =>
			(await fetch(new URL(path, url), { headers: { cookie } })).text();
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
	const lines = createInterface({ input: child.stderr });
	let protocol = "";
	child.stdout.on("data", (chunk) => {
		protocol += chunk;
	});
	const timer = setTimeout(() => child.kill(), 8000);
	try {
		let url = "";
		for await (const line of lines) {
			if (line.startsWith("http://127.0.0.1:")) {
				url = line;
				break;
			}
		}
		assert.ok(url, "Expected a login link on stderr");
		const cli = execFileSync(
			process.execPath,
			[resolve("node_modules/vite-plus/bin/vpx"), resolve("scripts/viewer-url.js")],
			{
				encoding: "utf8",
				env: { ...process.env, HOME: dir, USERPROFILE: dir },
			},
		);
		assert.ok(cli.includes(url) && cli.includes("ssh -N -L"));
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
