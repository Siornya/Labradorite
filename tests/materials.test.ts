import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { MaterialStore } from "../src/storage/materials.js";

const scope = { space: "own", character: "reader", world: "real" };
const input = {
	operation_id: "read-1",
	text: "我📖只读到第二章，对人物的理解还不确定。",
	source_kind: "activity_report",
	speaker: "reader",
	coverage: "仅阅读第一至第二章，尚未阅读后续章节",
};

test("unknown schemas and unrelated databases are not migrated or populated", () => {
	const directory = mkdtempSync(join(tmpdir(), "fish-schema-"));
	const path = join(directory, "unknown.db");
	const inspection = new Database(path);
	try {
		inspection.exec(
			"PRAGMA user_version=99; CREATE TABLE unrelated(value TEXT); INSERT INTO unrelated VALUES ('keep');",
		);
		assert.throws(() => new MaterialStore(path), /Unsupported database schema/);
		assert.equal(inspection.pragma("user_version", { simple: true }), 99);
		inspection.exec("PRAGMA user_version=0;");
		assert.throws(() => new MaterialStore(path), /unrecognized database/);
		assert.deepEqual(inspection.prepare("SELECT value FROM unrelated").get(), {
			value: "keep",
		});
		assert.equal(
			inspection.prepare("SELECT name FROM sqlite_master WHERE name='materials'").get(),
			undefined,
		);
	} finally {
		inspection.close();
		rmSync(directory, { recursive: true, force: true });
	}
});

test("material persists unchanged across reopen with stable idempotent receipt", () => {
	const directory = mkdtempSync(join(tmpdir(), "fish-materials-"));
	const path = join(directory, "memory.db");
	let store = new MaterialStore(path);
	try {
		const first = store.submit("client", scope, input);
		assert.equal(first.material.organization_status, "pending");
		assert.equal(first.material.authored_at, null);
		assert.equal(first.material.text, input.text);
		store.close();
		store = new MaterialStore(path);
		assert.deepEqual(store.read(scope, first.material.id), first.material);
		const replay = store.submit("client", scope, {
			...Object.fromEntries(Object.entries(input).reverse()),
			authored_at: null,
		});
		assert.equal(replay.replayed, true);
		assert.deepEqual(replay.material, first.material);
		assert.throws(() => store.submit("client", scope, { ...input, text: "changed" }), {
			message: "IDEMPOTENCY_CONFLICT",
		});
		assert.equal(
			store.submit("client", scope, { ...input, operation_id: "read-2" }).material.commit_seq,
			"2",
		);
	} finally {
		store.close();
		rmSync(directory, { recursive: true, force: true });
	}
});

test("scope isolation and reported source do not grant character authority", () => {
	const store = new MaterialStore(":memory:");
	try {
		const { material } = store.submit("client", scope, input);
		for (const other of [
			{ ...scope, space: "other" },
			{ ...scope, world: "fiction" },
			{ ...scope, character: "other" },
		]) {
			assert.throws(() => store.read(other, material.id), { message: "NOT_FOUND" });
		}
		assert.throws(() => store.submit("client", scope, { ...input, space_id: "other" }), {
			message: "VALIDATION_ERROR",
		});
		assert.throws(() => store.submit("client", scope, { ...input, text: "中".repeat(30000) }), {
			message: "VALIDATION_ERROR",
		});
		assert.throws(
			() => store.submit("client", scope, { ...input, authored_at: "2026-02-30T12:00:00Z" }),
			{
				message: "VALIDATION_ERROR",
			},
		);
		assert.equal(store.submit("second-client", scope, input).replayed, false);
	} finally {
		store.close();
	}
});

test("failed operation insert rolls back material and sequence together", () => {
	const directory = mkdtempSync(join(tmpdir(), "fish-rollback-"));
	const path = join(directory, "memory.db");
	const store = new MaterialStore(path);
	const inspection = new Database(path);
	try {
		inspection.exec(
			"CREATE TRIGGER fail_operation BEFORE INSERT ON operations BEGIN SELECT RAISE(ABORT, 'injected failure'); END;",
		);
		assert.throws(() => store.submit("client", scope, input));
		assert.equal(
			(inspection.prepare("SELECT count(*) AS n FROM materials").get() as { n: number }).n,
			0,
		);
		for (const table of ["search_chunks", "search_fts", "search_vectors"])
			assert.equal(
				(inspection.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n,
				0,
			);
		inspection.exec("DROP TRIGGER fail_operation");
		assert.equal(store.submit("client", scope, input).material.commit_seq, "1");
	} finally {
		inspection.close();
		store.close();
		rmSync(directory, { recursive: true, force: true });
	}
});
