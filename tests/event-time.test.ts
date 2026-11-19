import Database from "better-sqlite3";
import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MaterialStore } from "@/storage/materials.js";
import { ManualClock } from "@/domain/clock.js";
import type { EventTime } from "@/domain/event-time.js";

const scope = { space: "time", character: "reader", world: "real" };
const material = (operation_id: string) => ({
	operation_id,
	text: "旅行补充",
	source_kind: "character_statement",
	speaker: "reader",
	coverage: "回忆",
});
const proposal = (
	store: MaterialStore,
	source_ids: string[],
	operation_id: string,
	happen?: EventTime,
) => ({
	operation_id,
	base_seq: store.sequence(scope),
	title: operation_id,
	summary: "杭州旅行",
	source_ids,
	beats: [{ text: "杭州旅行", source_ids }],
	interpretations: [],
	thread: null,
	activity_state: "completed",
	unknowns: [],
	...(happen ? { happen } : {}),
});
const point = (id: string, value: string, precision: "day" | "month" = "day"): EventTime => ({
	kind: "point",
	start: { value, precision },
	utc_offset: "+08:00",
	basis: "stated",
	source_ids: [id],
});
const ids = (store: MaterialStore, args: Record<string, unknown> = {}) =>
	(
		store.recall(scope, {
			query: "",
			kind: "episode",
			time_basis: "happen",
			max_bytes: 16000,
			...args,
		}).items as { id: string }[]
	).map((x) => x.id);

test("backfilled events keep occurrence through later mentions, revisions, retry and reopen", () => {
	const directory = mkdtempSync(join(tmpdir(), "event-time-"));
	const path = join(directory, "memory.db");
	const clock = new ManualClock("2026-11-14T02:25:00Z");
	let store = new MaterialStore(path, clock);
	try {
		const source = store.submit("client", scope, material("source")).material;
		const recent = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "recent", point(source.id, "2026-11-13")),
		).episode;
		const old = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "old", point(source.id, "2026-10-03")),
		).episode;
		const unknown = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "unknown"),
		).episode;
		clock.advanceBy(7 * 86400000);
		const later = store.submit("client", scope, material("later")).material;
		const amendment = {
			operation_id: "mention",
			base_seq: store.sequence(scope),
			id: old.id,
			expected_revision: 1,
			append_source_ids: [later.id],
			summary: "后来补充的旅行细节",
		};
		const amended = store.amend("client", scope, amendment);
		assert.ok("episode" in amended);
		const revised = amended.episode;
		assert.equal(revised.review, "2026-11-21T02:25:00.000Z");
		assert.deepEqual(revised.happen, old.happen);
		const replay = store.amend("client", scope, amendment);
		assert.ok("replayed" in replay && replay.replayed);
		const full = {
			...proposal(store, [source.id, later.id], "full"),
			id: old.id,
			expected_revision: 2,
		};
		assert.ok(
			!store.previewEpisodeReview(scope, full).changes.some((c) => c.field === "happen"),
		);
		store.reviewEpisode("client", scope, full);
		store.close();
		store = new MaterialStore(path, clock);
		assert.deepEqual(ids(store), [recent.id, old.id, unknown.id]);
		assert.deepEqual(
			ids(store, { from: "2026-10-01T00:00:00+08:00", to: "2026-10-31T23:59:59+08:00" }),
			[old.id],
		);
		assert.deepEqual(
			ids(store, {
				query: "旅行",
				from: "2026-10-01T00:00:00+08:00",
				to: "2026-10-31T23:59:59+08:00",
			}),
			[old.id],
		);
		assert.deepEqual(
			ids(store, {
				time_basis: "review",
				from: "2026-10-01T00:00:00Z",
				to: "2026-10-31T23:59:59Z",
			}),
			[],
		);
		const clear = {
			...proposal(store, [source.id, later.id], "clear", {
				kind: "unknown",
				description: "日期待确认",
			}),
			id: old.id,
			expected_revision: 3,
		};
		assert.ok(
			store.previewEpisodeReview(scope, clear).changes.some((c) => c.field === "happen"),
		);
		store.reviewEpisode("client", scope, clear);
		assert.deepEqual(
			ids(store, { from: "2026-10-01T00:00:00Z", to: "2026-10-31T23:59:59Z" }),
			[],
		);
		assert.equal(store.history(scope, old.id)[0]!.happen!.start!.value, "2026-10-03");
	} finally {
		store.close();
		rmSync(directory, { recursive: true, force: true });
	}
});

test("event browsing pages past backfills, tied dates and unknown dates with the returned cursor", async () => {
	const store = new MaterialStore(":memory:");
	try {
		const source = store.submit("client", scope, material("source")).material;
		const save = (name: string, date?: string) =>
			store.reviewEpisode(
				"client",
				scope,
				proposal(store, [source.id], name, date ? point(source.id, date) : undefined),
			).episode;
		const december = save("December", "2026-12-01");
		const unknown = save("no-date");
		const january = save("January", "2026-01-01");
		const sameDay = save("later-mention", "2026-01-01");
		const latestUnknown = save("another-undated-event");
		const browse = (before_seq?: string) =>
			store.recallAsync(scope, {
				query: "",
				time_basis: "happen",
				limit: 1,
				max_bytes: 1024,
				...(before_seq ? { before_seq } : {}),
			});
		let cursor: string | undefined;
		for (const expected of [december, sameDay, january, latestUnknown, unknown]) {
			const result = await browse(cursor);
			const [item] = result.items as { id: string; commit_seq: string }[];
			assert.equal(item?.id, expected.id);
			assert.equal(item.commit_seq, expected.commit_seq);
			cursor = item.commit_seq;
		}
		assert.deepEqual((await browse(cursor)).items, []);
		await assert.rejects(browse(source.commit_seq), { message: "VALIDATION_ERROR" });
	} finally {
		store.close();
	}
});

test("calendar precision, offsets and intervals use possible overlap without inventing dates", () => {
	const store = new MaterialStore(":memory:");
	try {
		const source = store.submit("client", scope, material("source")).material;
		const month = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "month", point(source.id, "2024-02", "month")),
		).episode;
		assert.deepEqual(ids(store, { from: "2024-02-29T15:59:59Z", to: "2024-02-29T15:59:59Z" }), [
			month.id,
		]);
		assert.deepEqual(ids(store, { from: "2024-02-29T16:00:00Z" }), []);
		const interval: EventTime = {
			...point(source.id, "2026-10-30"),
			kind: "interval",
			end: { value: "2026-11-02", precision: "day" },
		};
		const trip = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "trip", interval),
		).episode;
		assert.deepEqual(
			ids(store, { from: "2026-11-01T00:00:00+08:00", to: "2026-11-01T00:00:00+08:00" }),
			[trip.id],
		);
		const partial = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "partial", {
				...point(source.id, "2026-10-30"),
				kind: "interval",
			}),
		).episode;
		assert.deepEqual(ids(store, { from: "2026-12-01T00:00:00Z" }), [partial.id]);
		const recall = store.recall(scope, {
			query: "旅行",
			kind: "episode",
			time_basis: "happen",
			to: "2024-03-01T00:00:00Z",
			max_bytes: 16000,
		});
		assert.deepEqual((recall.items[0] as { happen: EventTime }).happen, month.happen);
	} finally {
		store.close();
	}
});

test("external invalid event dates, precision, bounds and evidence are rejected atomically", () => {
	const store = new MaterialStore(":memory:");
	try {
		const source = store.submit("client", scope, material("source")).material;
		const valid = point(source.id, "2026-10-03");
		const invalid = [
			{ ...valid, start: { value: "2026-02-29", precision: "day" } },
			{ ...valid, start: { value: "2026-10", precision: "day" } },
			{ ...valid, utc_offset: undefined },
			{ ...valid, utc_offset: "+14:30" },
			{ ...valid, kind: "interval", end: { value: "2026-10-01", precision: "day" } },
			{ kind: "interval", basis: "stated", source_ids: [source.id] },
			{ ...valid, kind: "unknown" },
			{ ...valid, source_ids: undefined },
			{ ...valid, basis: undefined },
		];
		const seq = store.sequence(scope);
		for (const happen of invalid)
			assert.throws(
				() =>
					store.reviewEpisode("client", scope, {
						...proposal(store, [source.id], "bad"),
						happen,
					}),
				{ message: "VALIDATION_ERROR" },
			);
		assert.throws(
			() =>
				store.reviewEpisode(
					"client",
					scope,
					proposal(store, [source.id], "bad-evidence", {
						...valid,
						source_ids: ["unrelated"],
					}),
				),
			{ message: "SOURCE_INVALID" },
		);
		assert.equal(store.sequence(scope), seq);
		const saved = store.reviewEpisode(
			"client",
			scope,
			proposal(store, [source.id], "good", valid),
		).episode;
		const other = store.submit("client", scope, material("other")).material;
		assert.throws(
			() =>
				store.reviewEpisode("client", scope, {
					...proposal(store, [other.id], "retract-evidence"),
					id: saved.id,
					expected_revision: 1,
				}),
			{ message: "SOURCE_INVALID" },
		);
		assert.equal(store.episode(scope, saved.id).revision, 1);
	} finally {
		store.close();
	}
});

test("v4 stored time names read as review and happen without rewriting history", () => {
	const directory = mkdtempSync(join(tmpdir(), "event-v4-"));
	const path = join(directory, "memory.db");
	let store = new MaterialStore(path);
	try {
		const source = store.submit("client", scope, material("source")).material;
		const proposalInput = proposal(store, [source.id], "original");
		const original = store.reviewEpisode("client", scope, proposalInput).episode;
		store.close();
		// Fixture for the supported v4 on-disk format, before the public field rename.
		const db = new Database(path);
		const persisted = { ...original, recorded_at: original.review } as Record<string, unknown>;
		delete persisted.review;
		const body = JSON.stringify(persisted);
		db.prepare("UPDATE episodes SET body=? WHERE id=?").run(body, original.id);
		db.close();
		store = new MaterialStore(path, undefined, undefined, "search");
		const loaded = store.episode(scope, original.id);
		assert.equal(loaded.review, original.review);
		assert.ok(!("recorded_at" in loaded));
		assert.deepEqual(
			ids(store, { time_basis: "review", from: original.review, to: original.review }),
			[original.id],
		);
		store.close();
		store = new MaterialStore(path);
		assert.equal(store.reviewEpisode("client", scope, proposalInput).replayed, true);
		const amended = store.amend("client", scope, {
			operation_id: "amend",
			base_seq: store.sequence(scope),
			id: original.id,
			expected_revision: 1,
			happen: point(source.id, "2026-10-03"),
		});
		assert.ok("episode" in amended);
		assert.equal(amended.episode.happen?.start?.value, "2026-10-03");
		const inspection = new Database(path, { readonly: true });
		try {
			assert.equal(
				(
					inspection
						.prepare("SELECT body FROM episodes WHERE id=? AND revision=1")
						.get(original.id) as { body: string }
				).body,
				body,
			);
			const latest = JSON.parse(
				(
					inspection
						.prepare("SELECT body FROM episodes WHERE id=? AND revision=2")
						.get(original.id) as { body: string }
				).body,
			);
			assert.equal(latest.review, amended.episode.review);
			assert.ok(latest.happen && !("recorded_at" in latest) && !("happened_at" in latest));
		} finally {
			inspection.close();
		}
	} finally {
		store.close();
		rmSync(directory, { recursive: true, force: true });
	}
});
