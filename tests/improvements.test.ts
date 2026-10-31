import assert from "node:assert/strict";
import test from "node:test";
import { MaterialStore } from "../src/storage/materials.js";
import { ManualClock } from "../src/domain/clock.js";

const scope = { space: "review", character: "reader", world: "real" };
const material = (operation_id: string, text = operation_id) => ({
	operation_id,
	text,
	source_kind: "character_statement",
	speaker: "reader",
	coverage: "reported experience",
});
const proposal = (store: MaterialStore, source_ids: string[], operation_id = "organize") => ({
	operation_id,
	base_seq: store.sequence(scope),
	title: "阅读",
	summary: "只读了第一章，理解仍不确定。",
	source_ids,
	beats: [{ text: "开始阅读", source_ids }],
	interpretations: [],
	thread: "阅读",
	activity_state: "active",
	unknowns: ["后续未知"],
});
const entries = (store: MaterialStore, args: Record<string, unknown>) =>
	store.recall(scope, args).items as {
		id: string;
		excerpt?: string;
		value?: unknown;
		commit_seq: string;
		stale?: boolean;
		correction_ids?: string[];
	}[];

test("organization state follows current references, including gaps, revisions and deletion", () => {
	const store = new MaterialStore(":memory:");
	try {
		const a = store.submit("client", scope, material("a")).material;
		const b = store.submit("client", scope, material("b")).material;
		const c = store.submit("client", scope, material("c")).material;
		const first = store.organize("client", scope, proposal(store, [a.id, c.id])).episode;
		assert.equal(store.read(scope, a.id).organization_status, "organized");
		assert.equal(store.read(scope, b.id).organization_status, "pending");
		assert.equal(store.status(scope).oldest_pending_seq, b.commit_seq);
		assert.equal(store.status(scope).organization_complete, false);
		assert.deepEqual(
			entries(store, { query: "", organization_status: "pending" }).map((x) => x.id),
			[b.id],
		);
		store.organize("client", scope, {
			...proposal(store, [c.id], "replace"),
			id: first.id,
			expected_revision: 1,
		});
		assert.equal(store.read(scope, a.id).organization_status, "pending");
		assert.equal(store.status(scope).counts.episode_revisions, 2);
		const preview = store.previewDelete(scope, { source_ids: [a.id] });
		assert.equal(preview.counts.revisions, 2); // An old revision still depends on a.
		store.delete("client", scope, {
			operation_id: "erase",
			source_ids: [a.id],
			preview_token: preview.preview_token,
		});
		assert.equal(store.status(scope).counts.episodes, 0);
		assert.equal(store.status(scope).counts.pending, 2);
		assert.equal(store.read(scope, c.id).organization_status, "pending");
	} finally {
		store.close();
	}
});

test("recall reaches beyond the old 2000-material window and bounds excerpt bytes", () => {
	const store = new MaterialStore(":memory:");
	try {
		const first = store.submit(
			"client",
			scope,
			material("old", "旧事：海边见到蓝色灯塔。".repeat(500)),
		).material;
		for (let i = 0; i < 2001; i++)
			store.submit("client", scope, material(`filler-${i}`, `今天的日常记录 ${i}`));
		const result = store.recall(scope, { query: "蓝色灯塔", max_bytes: 1024 });
		assert.equal(result.coverage.candidate_scan_truncated, false);
		assert.equal(result.diagnostics.scanned, 2002);
		assert.equal((result.items[0] as { id: string }).id, first.id);
		assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 1024);
		assert.ok(!JSON.stringify(result).includes(first.text));
		const recent = entries(store, { query: "", kind: "material", limit: 2 });
		assert.ok(BigInt(recent[0]!.commit_seq) > BigInt(recent[1]!.commit_seq));
		const older = entries(store, {
			query: "",
			kind: "material",
			limit: 2,
			before_seq: recent[1]!.commit_seq,
		});
		assert.ok(older.every((x) => BigInt(x.commit_seq) < BigInt(recent[1]!.commit_seq)));
		assert.throws(() => store.recall(scope, { query: "蓝色", before_seq: "4" }), {
			message: "VALIDATION_ERROR",
		});
	} finally {
		store.close();
	}
});

test("time windows distinguish authored and received time without inventing missing timestamps", () => {
	const store = new MaterialStore(":memory:", new ManualClock("2026-11-01T00:00:00Z"));
	try {
		const a = store.submit("client", scope, {
			...material("a", "蓝色灯塔"),
			authored_at: "2020-01-02T08:00:00+08:00",
			channel: "qq",
			conversation_id: "chat-1",
			thread: "旅行",
		}).material;
		store.submit("client", scope, material("unknown", "蓝色灯塔"));
		assert.deepEqual(
			entries(store, {
				query: "灯塔",
				time_basis: "authored_at",
				from: "2020-01-02T00:00:00Z",
				to: "2020-01-02T00:00:00Z",
			}).map((x) => x.id),
			[a.id],
		);
		assert.equal(
			entries(store, {
				query: "灯塔",
				from: "2020-01-01T00:00:00Z",
				to: "2020-12-31T00:00:00Z",
			}).length,
			0,
		);
		assert.deepEqual(
			entries(store, { query: "", channel: "qq", thread: "旅行" }).map((x) => x.id),
			[a.id],
		);
		assert.equal(store.read(scope, a.id).conversation_id, "chat-1");
		for (const args of [
			{ query: "", from: "" },
			{ query: "", from: "2026-02-30T00:00:00Z" },
			{ query: "", from: "2026-11-02T00:00:00Z", to: "2026-11-01T00:00:00Z" },
		])
			assert.throws(() => store.recall(scope, args), { message: "VALIDATION_ERROR" });
		assert.throws(() => store.recall({ ...scope, character: "other" }, { query: "" }), {
			message: "NOT_FOUND",
		});
		store.bindScope({ ...scope, world: "fiction" });
		assert.equal(entriesForOther(), 0);
		function entriesForOther() {
			return store.recall({ ...scope, world: "fiction" }, { query: "" }).items.length;
		}
	} finally {
		store.close();
	}
});

test("exact duplicate hints preserve distinct events and never expose deleted or other-world material", () => {
	const store = new MaterialStore(":memory:");
	try {
		const a = store.submit("client", scope, material("a", "相同的话"));
		const b = store.submit("client", scope, { ...material("b", "相同的话"), channel: "qq" });
		assert.notEqual(a.material.id, b.material.id);
		assert.deepEqual(b.duplicate_candidates.ids, [a.material.id]);
		assert.equal(b.duplicate_candidates.automatically_merged, false);
		assert.deepEqual(
			store.submit("client", { ...scope, world: "fiction" }, material("fiction", "相同的话"))
				.duplicate_candidates.ids,
			[],
		);
		const preview = store.previewDelete(scope, { source_ids: [a.material.id] });
		store.delete("client", scope, {
			operation_id: "delete-a",
			source_ids: [a.material.id],
			preview_token: preview.preview_token,
		});
		assert.deepEqual(
			store.submit("client", scope, material("c", "相同的话")).duplicate_candidates.ids,
			[b.material.id],
		);
		assert.equal(
			store.submit("client", scope, { ...material("b", "相同的话"), channel: "qq" }).replayed,
			true,
		);
	} finally {
		store.close();
	}
});

test("organization diff and incremental amendments preserve untouched content and retry identity", () => {
	const store = new MaterialStore(":memory:");
	try {
		const a = store.submit("client", scope, material("a")).material;
		const p = proposal(store, [a.id]);
		const seq = store.sequence(scope);
		assert.equal(
			store.previewOrganization(scope, p).changes.some((c) => c.field === "summary"),
			true,
		);
		assert.equal(store.sequence(scope), seq);
		assert.equal(store.status(scope).counts.episodes, 0);
		const ep = store.organize("client", scope, p).episode;
		const b = store.submit("client", scope, material("b")).material;
		const amendment = {
			operation_id: "amend",
			base_seq: store.sequence(scope),
			id: ep.id,
			expected_revision: 1,
			append_source_ids: [b.id],
			append_beats: [{ text: "又读了一章", source_ids: [b.id] }],
			append_unknowns: ["人物动机未知"],
			activity_state: "paused",
		};
		const preview = store.amend("client", scope, { ...amendment, dry_run: true });
		assert.ok("changes" in preview);
		assert.equal(store.episode(scope, ep.id).revision, 1);
		const updated = store.amend("client", scope, amendment);
		assert.ok("episode" in updated);
		assert.equal(updated.episode.summary, ep.summary);
		assert.deepEqual(updated.episode.beats[0], ep.beats[0]);
		assert.equal(updated.episode.beats.length, 2);
		const replay = store.amend("client", scope, amendment);
		assert.ok("replayed" in replay && replay.replayed);
		assert.equal(store.history(scope, ep.id).length, 2);
		assert.throws(() => store.amend("client", scope, { ...amendment, summary: "改变了" }), {
			message: "IDEMPOTENCY_CONFLICT",
		});
		assert.throws(
			() =>
				store.amend("client", scope, {
					...amendment,
					operation_id: "stale",
					base_seq: store.sequence(scope),
				}),
			{ message: "REVISION_CONFLICT" },
		);
		const overlapping = store.previewOrganization(scope, proposal(store, [a.id], "another"));
		assert.deepEqual(overlapping.overlapping_episode_ids, [ep.id]);
		assert.equal(overlapping.semantic_conflict_check, "not_performed");
	} finally {
		store.close();
	}
});

test("deletion preview includes transitive corrections and all revisions and rejects changed impact", () => {
	const store = new MaterialStore(":memory:");
	try {
		const a = store.submit("client", scope, material("a")).material;
		const b = store.submit("client", scope, { ...material("b"), corrects: a.id }).material;
		const c = store.submit("client", scope, { ...material("c"), corrects: b.id }).material;
		const ep = store.organize("client", scope, proposal(store, [a.id, b.id, c.id])).episode;
		const seq = store.sequence(scope);
		const preview = store.previewDelete(scope, { source_ids: [a.id] });
		assert.deepEqual(new Set(preview.source_ids), new Set([a.id, b.id, c.id]));
		assert.deepEqual(preview.episodes, [{ id: ep.id, revisions: 1 }]);
		assert.equal(store.sequence(scope), seq);
		assert.equal(store.read(scope, a.id).text, "a");
		assert.throws(
			() => store.delete("client", scope, { operation_id: "erase", source_ids: [a.id] }),
			{ message: "VALIDATION_ERROR" },
		);
		assert.throws(
			() =>
				store.delete("client", scope, {
					operation_id: "erase",
					source_ids: [b.id],
					preview_token: preview.preview_token,
				}),
			{ message: "STALE_PREVIEW" },
		);
		store.submit("client", scope, material("new"));
		assert.throws(
			() =>
				store.delete("client", scope, {
					operation_id: "erase",
					source_ids: [a.id],
					preview_token: preview.preview_token,
				}),
			{ message: "STALE_PREVIEW" },
		);
		const current = store.previewDelete(scope, { source_ids: [a.id] });
		const request = {
			operation_id: "erase",
			source_ids: [a.id],
			preview_token: current.preview_token,
		};
		assert.equal(store.delete("client", scope, request).replayed, false);
		assert.equal(store.delete("client", scope, request).replayed, true);
		assert.throws(() => store.previewDelete(scope, { source_ids: [a.id] }), {
			message: "NOT_FOUND",
		});
	} finally {
		store.close();
	}
});

test("recall marks transitive corrections as background and reports matching diagnostics", () => {
	const store = new MaterialStore(":memory:");
	try {
		const a = store.submit("client", scope, material("a", "第一章最初理解")).material;
		const b = store.submit("client", scope, {
			...material("b", "第二章更正"),
			corrects: a.id,
		}).material;
		const c = store.submit("client", scope, {
			...material("c", "第三章再次更正"),
			corrects: b.id,
		}).material;
		const result = store.recall(scope, { query: "最初理解", kind: "material", limit: 1 });
		assert.equal(result.context_role, "historical_background");
		assert.equal(result.diagnostics.model_usage, "unknown");
		const item = result.items[0] as {
			id: string;
			stale: boolean;
			correction_ids: string[];
			value?: unknown;
			excerpt: string;
		};
		assert.equal(item.id, a.id);
		assert.equal(item.stale, true);
		assert.deepEqual(new Set(item.correction_ids), new Set([b.id, c.id]));
		assert.equal(item.value, undefined);
		assert.ok(a.text.includes(item.excerpt));
		assert.equal(store.read(scope, a.id).context_role, "historical_background");
	} finally {
		store.close();
	}
});
