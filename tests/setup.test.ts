import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import Database from "better-sqlite3";
import { MaterialStore } from "../src/storage/materials.js";
import { loadRuntimeConfig } from "../src/runtime-config.js";

test("setup produces private runtime and usable stdio configuration without changing existing settings", () => {
	const dir = mkdtempSync(join(tmpdir(), "fish-setup-"));
	try {
		const run = () =>
			spawnSync(process.execPath, [resolve("dist/src/setup.js"), dir], { encoding: "utf8" });
		const first = run();
		assert.equal(first.status, 0, first.stderr);
		const path = join(dir, "runtime.json");
		const config = loadRuntimeConfig(path);
		assert.ok(!("token" in config));
		const mcp = JSON.parse(readFileSync(join(dir, "mcp.json"), "utf8")).mcpServers[
			"fish-memory"
		];
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

test("v1 database is rejected unchanged as requested", () => {
	const dir = mkdtempSync(join(tmpdir(), "fish-v1-"));
	const path = join(dir, "old.db");
	const db = new Database(path);
	try {
		db.exec(
			"PRAGMA user_version=1; CREATE TABLE old_materials(body TEXT); INSERT INTO old_materials VALUES ('keep');",
		);
		assert.throws(() => new MaterialStore(path), /Unsupported database schema/);
		assert.equal(db.pragma("user_version", { simple: true }), 1);
		assert.deepEqual(db.prepare("SELECT body FROM old_materials").get(), { body: "keep" });
	} finally {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});
