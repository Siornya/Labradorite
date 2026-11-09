import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { test } from "vite-plus/test";

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
		const cli = execFileSync(process.execPath, [resolve("dist/src/viewer-url.js")], {
			encoding: "utf8",
			env: { ...process.env, HOME: dir, USERPROFILE: dir },
		});
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
