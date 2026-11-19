import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { MaterialStore } from "@/storage/materials.js";

test("undo restores the episode and person together, keeps sources searchable and reserves withdrawn revision numbers", () => {
	const store = new MaterialStore(":memory:");
	const scope = { space: "home", world: "real", character: "reader" };
	try {
		const source = store.submit("client", scope, {
			operation_id: "submit",
			source_kind: "character_statement",
			speaker: "我",
			coverage: "当天",
			text: "在码头见到了小林。",
		}).material;
		const draft = {
			operation_id: "first",
			title: "码头",
			summary: "旧的摘要",
			base_seq: store.sequence(scope),
			source_ids: [source.id],
			beats: [{ text: "见面", source_ids: [source.id] }],
			interpretations: [],
			unknowns: [],
			thread: null,
			activity_state: "completed",
			person_review: { name: "小林", identity: "朋友", impression: "话少" },
		};
		const first = store.reviewEpisode("client", scope, draft);
		const revision = {
			...draft,
			id: first.episode.id,
			expected_revision: 1,
			operation_id: "update",
			base_seq: store.sequence(scope),
			summary: "鲜花",
			person_review: { id: first.person!.id, expected_revision: 1, impression: "健谈" },
		};
		const second = store.reviewEpisode("client", scope, revision);
		const [update, create] = store.reviews.list(scope, 0).items;
		assert.equal(store.reviews.act({ ...scope, world: "other" }, update!.key, "undo"), 404);
		assert.equal(store.reviews.act(scope, create!.key, "undo"), 409);
		const later = store.reviewPerson("client", scope, {
			operation_id: "observer",
			base_seq: store.sequence(scope),
			name: "阿明",
			identity: "邻居",
			episodes: [{ id: first.episode.id, revision: 2 }],
			impression: "常在码头",
		});
		assert.equal(store.reviews.act(scope, update!.key, "undo"), 409);
		assert.ok(
			store.reviews.detail(scope, update!.key)!.blockers.some((s) => s.includes("阿明")),
		);
		assert.equal(store.person(scope, second.person!.id).current_impression?.impression, "健谈");

		const dependent = store.reviews.list(scope, 0).items[0]!;
		assert.equal(store.reviews.act(scope, dependent.key, "undo"), 303);
		assert.throws(() => store.person(scope, later.id), /NOT_FOUND/);
		assert.equal(store.reviews.act(scope, update!.key, "undo"), 303);
		assert.equal(store.episode(scope, first.episode.id).summary, "旧的摘要");
		assert.equal(store.person(scope, first.person!.id).current_impression?.impression, "话少");
		assert.equal(store.recall(scope, { query: "鲜花", kind: "episode" }).items.length, 0);
		assert.equal(store.recall(scope, { query: "摘要", kind: "episode" }).items.length, 1);
		const sequence = store.sequence(scope);
		assert.equal(store.reviews.act(scope, update!.key, "undo"), 303);
		assert.equal(store.sequence(scope), sequence);
		const fresh = store.reviewEpisode("client", scope, {
			...revision,
			base_seq: sequence,
			operation_id: "new",
		});
		assert.equal(fresh.episode.revision, 3);
		assert.equal(fresh.person!.revision, 3);
		assert.throws(() => store.reviewEpisode("client", scope, revision), /NOT_FOUND/);
		assert.throws(() => store.episode(scope, first.episode.id, 2), /NOT_FOUND/);
		assert.equal(
			store.reviews.act(scope, store.reviews.list(scope, 0).items[0]!.key, "undo"),
			303,
		);
		const laterSource = store.submit("client", scope, {
			operation_id: "later-source",
			source_kind: "character_statement",
			speaker: "我",
			coverage: "再会",
			text: "又见到小林。",
		}).material;
		const another = store.reviewEpisode("client", scope, {
			...draft,
			operation_id: "later-episode",
			base_seq: store.sequence(scope),
			source_ids: [laterSource.id],
			beats: [{ text: "再会", source_ids: [laterSource.id] }],
			person_review: { id: first.person!.id, expected_revision: 1, impression: "健谈" },
		});
		const deletion = store.previewDelete(scope, { source_ids: [laterSource.id] });
		store.delete("client", scope, {
			operation_id: "remove-later-source",
			source_ids: [laterSource.id],
			preview_token: deletion.preview_token,
		});
		assert.equal(store.person(scope, first.person!.id).revision, another.person!.revision);
		assert.equal(store.reviews.act(scope, create!.key, "undo"), 303);
		assert.equal(store.read(scope, source.id).review_status, "pending");
		assert.equal(store.recall(scope, { query: "", kind: "episode" }).items.length, 0);
		assert.throws(() => store.person(scope, first.person!.id), /NOT_FOUND/);
	} finally {
		store.close();
	}
});

test("v4 receipts without audit metadata remain scoped, reviewable and revocable after reopening", () => {
	const dir = mkdtempSync(join(tmpdir(), "v4-reviews-"));
	const database = join(dir, "memory.db");
	const scope = { space: "shared", world: "real", character: "reader" };
	const store = new MaterialStore(database);
	try {
		for (const world of ["real", "fiction"]) {
			const target = { ...scope, world };
			const source = store.submit("client", target, {
				operation_id: "source-" + world,
				text: world,
				source_kind: "activity_report",
				speaker: "我",
				coverage: "今天",
			}).material;
			const { episode } = store.reviewEpisode("client", target, {
				operation_id: "review-" + world,
				base_seq: store.sequence(target),
				title: world,
				summary: world,
				source_ids: [source.id],
				beats: [{ text: world, source_ids: [source.id] }],
				interpretations: [],
				unknowns: [],
				thread: null,
				activity_state: "completed",
			});
			store.reviewPerson("client", target, {
				operation_id: "person-" + world,
				base_seq: store.sequence(target),
				name: world,
				identity: "朋友",
				episodes: [{ id: episode.id, revision: 1 }],
				impression: world,
			});
		}
	} finally {
		store.close();
	}
	try {
		const old = new Database(database);
		try {
			// The previous v4 writer stored only the result references.
			old.exec("UPDATE memory_operations SET result=json_remove(result,'$.audit')");
		} finally {
			old.close();
		}
		const reopened = new MaterialStore(database);
		try {
			const rows = reopened.reviews.list(scope, 0).items;
			assert.equal(rows.length, 2);
			assert.equal(rows[0]!.name, "real");
			assert.equal(rows[1]!.title, "real");
			assert.equal(reopened.reviews.act(scope, rows[0]!.key, "undo"), 303);
			assert.equal(reopened.reviews.act(scope, rows[1]!.key, "undo"), 303);
			assert.ok(
				reopened.reviews
					.list(scope, 0)
					.items.every((row) => row.state === "undone" && row.time),
			);
			assert.ok(
				reopened.reviews
					.list({ ...scope, world: "fiction" }, 0)
					.items.every((row) => row.state === "pending"),
			);
		} finally {
			reopened.close();
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
