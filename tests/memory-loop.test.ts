import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MaterialStore } from "../src/storage/materials.js";

const scope = { space: "life", character: "writer", world: "real" };
const source = (operation_id: string, text: string) => ({
	operation_id,
	text,
	source_kind: "character_statement",
	speaker: "writer",
	coverage: "本次表达，不证明音频实际播放",
});
function proposal(store: MaterialStore, ids: string[], operation_id = "organize-1") {
	return {
		operation_id,
		base_seq: store.sequence(scope),
		title: "共同创作歌曲",
		summary: "起初误解用户的反馈，后来澄清，创作暂停在第二版主歌。",
		source_ids: ids,
		beats: [{ text: "反馈、误解、澄清，然后暂停。", source_ids: ids }],
		interpretations: [
			{
				text: "我起初以为你否定了整首，后来理解这是局部反馈。",
				kind: "expressed",
				source_ids: ids,
			},
		],
		thread: "歌曲创作",
		activity_state: "paused",
		unknowns: ["没有作品完成或试听成功的记录"],
	};
}

test("experience loop preserves original views, detects stale work, revises and survives reopen", () => {
	const dir = mkdtempSync(join(tmpdir(), "fish-loop-"));
	const path = join(dir, "memory.db");
	let store = new MaterialStore(path);
	try {
		const a = store.submit(
			"client",
			scope,
			source("a", "我以为你不喜欢这首，有点泄气。"),
		).material;
		const b = store.submit(
			"client",
			scope,
			source("b", "原来我理解偏了，先暂停在第二版主歌。"),
		).material;
		const initial = proposal(store, [a.id, b.id]);
		const first = store.organize("client", scope, initial).episode;
		assert.equal(first.revision, 1);
		assert.equal(store.organize("client", scope, initial).replayed, true);
		const stale = {
			...proposal(store, [a.id, b.id], "stale"),
			id: first.id,
			expected_revision: 1,
		};
		const c = store.submit("client", scope, {
			...source("c", "更正暂停位置：第三版主歌，尚未完成。"),
			corrects: b.id,
		}).material;
		assert.throws(() => store.organize("client", scope, stale), { message: "STALE_BASIS" });
		const recalled = store.recall(scope, { query: "第二版主歌", max_bytes: 16000 });
		assert.ok(JSON.stringify(recalled).includes(c.id));
		assert.ok(JSON.stringify(recalled).includes('"stale":true'));
		const next = {
			...proposal(store, [a.id, b.id, c.id], "revision-2"),
			id: first.id,
			expected_revision: 1,
			summary: "暂停位置已更正为第三版主歌；仍未完成。",
		};
		const second = store.organize("client", scope, next).episode;
		assert.equal(second.revision, 2);
		assert.equal(store.history(scope, first.id)[0]!.summary, initial.summary);
		assert.equal(store.read(scope, b.id).text, b.text);
		assert.throws(
			() =>
				store.organize("client", scope, {
					...next,
					operation_id: "old-revision",
					base_seq: store.sequence(scope),
				}),
			{ message: "REVISION_CONFLICT" },
		);
		store.close();
		store = new MaterialStore(path);
		assert.equal(store.episode(scope, first.id).revision, 2);
		assert.equal(store.history(scope, first.id).length, 2);
		assert.ok(store.recall(scope, { query: "第三版主歌" }).items.length > 0);
	} finally {
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test("deletion blocks source reads, episode history, operation replay and new organization", () => {
	const store = new MaterialStore(":memory:");
	try {
		const input = source("a", "保密经历");
		const material = store.submit("client", scope, input).material;
		const organized = proposal(store, [material.id]);
		const ep = store.organize("client", scope, organized).episode;
		const correction = store.submit("client", scope, {
			...source("correction", "保密经历的更正"),
			corrects: material.id,
		}).material;
		const deletion = {
			operation_id: "erase",
			source_ids: [material.id],
			preview_token: store.previewDelete(scope, { source_ids: [material.id] }).preview_token,
		};
		assert.equal(store.delete("client", scope, deletion).online_blocked, true);
		assert.equal(store.delete("client", scope, deletion).replayed, true);
		assert.throws(() => store.read(scope, material.id), { message: "NOT_FOUND" });
		assert.throws(() => store.episode(scope, ep.id), { message: "NOT_FOUND" });
		assert.throws(() => store.history(scope, ep.id), { message: "NOT_FOUND" });
		assert.throws(() => store.submit("client", scope, input), { message: "NOT_FOUND" });
		assert.throws(() => store.organize("client", scope, organized), { message: "NOT_FOUND" });
		assert.equal(store.recall(scope, { query: "" }).items.length, 0);
		assert.throws(() => store.read(scope, correction.id), { message: "NOT_FOUND" });
		assert.throws(
			() =>
				store.organize("client", scope, {
					...organized,
					operation_id: "revive",
					base_seq: store.sequence(scope),
				}),
			{ message: "NOT_FOUND" },
		);
	} finally {
		store.close();
	}
});

test("scope, provenance and byte budget constrain organized recall", () => {
	const store = new MaterialStore(":memory:");
	try {
		const material = store.submit("client", scope, {
			...source("a", "只读到第二章".repeat(2000)),
			source_kind: "user_report",
		}).material;
		assert.throws(() => store.organize("client", scope, proposal(store, [material.id])), {
			message: "SOURCE_INVALID",
		});
		const inferred = {
			...proposal(store, [material.id]),
			interpretations: [{ text: "可能有误解", kind: "inferred", source_ids: [material.id] }],
		};
		const ep = store.organize("client", scope, inferred).episode;
		assert.equal(ep.semantic_status, "model_proposed");
		assert.throws(() => store.episode({ ...scope, world: "fiction" }, ep.id), {
			message: "NOT_FOUND",
		});
		const result = store.recall(scope, { query: "第二章", max_bytes: 1024 });
		assert.ok(Buffer.byteLength(JSON.stringify(result), "utf8") <= 1024);
		assert.equal(result.coverage.output_truncated, true);
		assert.equal(result.coverage.retrieval_exhaustiveness, "unknown");
	} finally {
		store.close();
	}
});
