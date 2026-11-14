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

test("viewer termination runs cleanup after opening a library", async () => {
	const dir = mkdtempSync(join(tmpdir(), "viewer-signal-"));
	const runtime = join(dir, "runtime.json");
	const database = join(dir, "memory.db");
	new MaterialStore(database).close();
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
