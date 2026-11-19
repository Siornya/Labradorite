import { describeEventTime } from "@/domain/event-time.js";
import type Database from "better-sqlite3";
import type { Episode, MemoryScope } from "./materials.js";
import type { SearchIndex } from "@/retrieval/index.js";
import { readEpisodeBody, episodeChanges } from "./episode-body.js";
import { readPerson } from "./profiles.js";
import type { SettingLog } from "./settings.js";

type State = "pending" | "checked" | "undone";
type Ref = { id: string; revision: number };
interface Entry {
	key: string;
	kind: "organize" | "review_person";
	state: State;
	time: string;
	title: string | null;
	name: string | null;
	episodeId: string | null;
	episodeRevision: number | null;
	personId: string | null;
	personRevision: number | null;
}

// v4 receipts already group an episode and its optional person review. Resolve old receipts
// through their scoped entities. Retain only identifiers and audit metadata after an undo.
const entries = `SELECT o.rowid AS position,o.digest AS key,o.kind,
	COALESCE(json_extract(o.result,'$.audit.state'),'pending') AS state,
	COALESCE(json_extract(o.result,'$.audit.time'),json_extract(e.body,'$.review'),json_extract(e.body,'$.recorded_at'),r.formed_at) AS time,
	json_extract(e.body,'$.title') AS title,p.name,
	CASE WHEN o.kind='organize' THEN json_extract(o.result,'$.id') END AS episodeId,
	CASE WHEN o.kind='organize' THEN json_extract(o.result,'$.revision') END AS episodeRevision,
	CASE WHEN o.kind='review_person' THEN json_extract(o.result,'$.id') ELSE json_extract(o.result,'$.person.id') END AS personId,
	CASE WHEN o.kind='review_person' THEN json_extract(o.result,'$.revision') ELSE json_extract(o.result,'$.person.revision') END AS personRevision
	FROM memory_operations o JOIN spaces s ON s.id=o.space
	LEFT JOIN episodes e ON o.kind='organize' AND e.id=json_extract(o.result,'$.id') AND e.revision=json_extract(o.result,'$.revision') AND e.space=o.space
	LEFT JOIN people p ON p.id=CASE WHEN o.kind='review_person' THEN json_extract(o.result,'$.id') ELSE json_extract(o.result,'$.person.id') END AND p.space=o.space
	LEFT JOIN person_reviews r ON r.person=p.id AND r.revision=CASE WHEN o.kind='review_person' THEN json_extract(o.result,'$.revision') ELSE json_extract(o.result,'$.person.revision') END
	WHERE o.kind IN ('organize','review_person') AND o.space=? AND s.character=? AND COALESCE(json_extract(o.result,'$.audit.world'),e.world,p.world)=?`;

const fields = {
	title: "标题",
	summary: "摘要",
	source_ids: "来源",
	beats: "经过",
	interpretations: "当时的理解",
	thread: "生活线",
	activity_state: "活动状态",
	unknowns: "尚不清楚",
	happen: "发生时间",
} as const;

const activityLabels = {
	active: "进行中",
	paused: "已暂停",
	completed: "已完成",
	abandoned: "已放弃",
	unknown: "未知",
};

function fieldText(
	episode: Episode | undefined,
	field: keyof typeof fields,
	sources: Map<string, string>,
) {
	if (!episode) return "无";
	const evidence = (ids: string[]) => ids.map((id) => sources.get(id) ?? id).join("、");
	switch (field) {
		case "source_ids":
			return evidence(episode.source_ids);
		case "beats":
			return episode.beats
				.map((b) => b.text + "（依据：" + evidence(b.source_ids) + "）")
				.join("\n");
		case "interpretations": {
			const kinds = { expressed: "当时表达", retrospective: "事后回顾", inferred: "推断" };
			return (
				episode.interpretations
					.map(
						(i) =>
							kinds[i.kind] +
							" · " +
							i.text +
							"（依据：" +
							evidence(i.source_ids) +
							"）",
					)
					.join("\n") || "无"
			);
		}
		case "happen":
			return (
				describeEventTime(episode.happen) +
				(episode.happen?.source_ids?.length
					? "（依据：" + evidence(episode.happen.source_ids) + "）"
					: "")
			);
		case "unknowns":
			return episode.unknowns.join("\n") || "无";
		case "activity_state":
			return activityLabels[episode.activity_state];
		default:
			return episode[field] ?? "无";
	}
}
export class ReviewLog {
	constructor(
		private readonly db: Database.Database,
		private readonly search: SearchIndex,
		private readonly settings: SettingLog,
	) {}

	list(scope: MemoryScope, page: number) {
		const rows = this.db
			.prepare(
				entries +
					` UNION ALL SELECT o.rowid,json_extract(result,'$.version'),o.kind,
				json_extract(result,'$.state'),json_extract(result,'$.time'),json_extract(result,'$.title'),NULL,NULL,NULL,NULL,NULL
				FROM memory_operations o JOIN spaces s ON s.id=o.space WHERE o.kind='setting' AND o.space=? AND s.character=?
				AND (json_extract(result,'$.world')=? OR json_extract(result,'$.target')='character')
				ORDER BY position DESC LIMIT 31 OFFSET ?`,
			)
			.all(
				scope.space,
				scope.character,
				scope.world,
				scope.space,
				scope.character,
				scope.world,
				page * 30,
			) as (Omit<Entry, "kind" | "state"> & {
			kind: Entry["kind"] | "setting";
			state: State | "proposed" | "unreviewed" | "rejected";
		})[];
		return { items: rows.slice(0, 30), next: rows.length > 30 };
	}

	#episode(id: string, revision: number, previous: boolean) {
		const row = this.db
			.prepare(
				"SELECT body FROM episodes WHERE id=? AND revision" +
					(previous ? "<? ORDER BY revision DESC" : "=?") +
					" LIMIT 1",
			)
			.get(id, revision) as { body: string } | undefined;
		return row && readEpisodeBody(row.body);
	}

	#detail(scope: MemoryScope, key: string) {
		const entry = this.db
			.prepare(entries + " AND o.digest=?")
			.get(scope.space, scope.character, scope.world, key) as Entry | undefined;
		if (!entry) return;
		const episode = entry.episodeId
			? this.#episode(entry.episodeId, entry.episodeRevision!, false)
			: undefined;
		const previous = episode && this.#episode(episode.id, episode.revision, true);
		const profile = entry.personId ? readPerson(this.db, scope, entry.personId) : undefined;
		const review = profile?.history.find((r) => r.revision === entry.personRevision);
		const blockers: string[] = [];
		if (entry.state !== "undone") {
			if ((entry.episodeId && !episode) || (entry.personId && !review))
				blockers.push("本次回顾的记录已因来源删除而撤下。");
			if (episode) {
				for (const change of this.settings.history(scope)) {
					if (
						change.state !== "undone" &&
						change.state !== "rejected" &&
						change.episodes.some(
							(ref) => ref.id === episode.id && ref.revision === episode.revision,
						)
					)
						blockers.push(
							"设定「" + change.title + "」引用了这次经历，请先处理该设定变化。",
						);
				}
				const later = this.db
					.prepare(
						"SELECT revision FROM episodes WHERE id=? AND revision>? ORDER BY revision DESC LIMIT 1",
					)
					.get(episode.id, episode.revision) as { revision: number } | undefined;
				if (later) blockers.push("这条经历已有后续版本 " + later.revision + "。");
				const dependents = this.db
					.prepare(`SELECT p.name,r.review FROM person_evidence r JOIN people p ON p.id=r.person
					WHERE r.episode=? AND r.revision=? AND NOT (r.person=? AND r.review=?) ORDER BY p.name,r.review`)
					.all(
						episode.id,
						episode.revision,
						entry.personId ?? "",
						entry.personRevision ?? 0,
					) as { name: string; review: number }[];
				for (const d of dependents)
					blockers.push(d.name + " 的人物回顾（版本 " + d.review + "）引用了这次经历。");
			}
			const latestVisible = profile?.history.at(-1);
			if (profile && latestVisible && latestVisible.revision > entry.personRevision!)
				blockers.push(
					profile.name + " 已有后续人物回顾（版本 " + latestVisible.revision + "）。",
				);
		}
		const sourceIds = [
			...new Set([...(episode?.source_ids ?? []), ...(previous?.source_ids ?? [])]),
		];
		const sources = this.db
			.prepare(
				"SELECT id,substr(json_extract(body,'$.text'),1,120) AS text FROM materials WHERE id IN (SELECT value FROM json_each(?)) AND space=? AND world=?",
			)
			.all(JSON.stringify(sourceIds), scope.space, scope.world) as {
			id: string;
			text: string;
		}[];
		const sourceNames = new Map(sources.map((m) => [m.id, m.text]));
		const changes = episode
			? episodeChanges(previous, episode).map(({ field }) => ({
					label: fields[field],
					before: fieldText(previous, field, sourceNames),
					after: fieldText(episode, field, sourceNames),
				}))
			: [];
		const previousJudgment =
			profile &&
			review &&
			(this.db
				.prepare(`SELECT impression FROM person_reviews
			WHERE person=? AND revision<? AND (impression IS NOT NULL OR withdrawn='impression') ORDER BY revision DESC LIMIT 1`)
				.get(profile.id, review.revision) as { impression: string | null } | undefined);
		return {
			entry,
			episode,
			previous,
			review,
			profile,
			priorImpression: previousJudgment?.impression,
			changes,
			sources,
			blockers,
		};
	}

	detail(scope: MemoryScope, key: string) {
		return this.db.transaction(() => this.#detail(scope, key))();
	}

	// Keep withdrawn revision numbers reserved so saved links and retry receipts
	// can never resolve to a different interpretation after a subsequent edit.
	nextRevision(kind: "episode" | "person", id: string, current: number) {
		const row = this.db
			.prepare("SELECT value FROM metadata WHERE key=?")
			.get("review_floor:" + kind + ":" + id) as { value: string } | undefined;
		return Math.max(current, Number(row?.value ?? 0)) + 1;
	}
	#reserve(kind: "episode" | "person", ref: Ref) {
		this.db
			.prepare(
				`INSERT INTO metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=CAST(MAX(CAST(value AS INTEGER),CAST(excluded.value AS INTEGER)) AS TEXT)`,
			)
			.run("review_floor:" + kind + ":" + ref.id, String(ref.revision));
	}

	act(scope: MemoryScope, key: string, action: "check" | "undo") {
		return this.db
			.transaction(() => {
				const detail = this.#detail(scope, key);
				if (!detail) return 404;
				const { entry, episode, previous, profile, review, blockers } = detail;
				const state = action === "undo" ? "undone" : "checked";
				if (entry.state === state) return 303;
				if (entry.state === "undone" || (action === "undo" && blockers.length)) return 409;
				if (action === "undo") {
					if (profile && review) {
						this.#reserve("person", { id: profile.id, revision: profile.revision });
						if (review.revision === 1)
							this.db.prepare("DELETE FROM people WHERE id=?").run(profile.id);
						else
							this.db
								.prepare("DELETE FROM person_reviews WHERE person=? AND revision=?")
								.run(profile.id, review.revision);
					}
					if (episode) {
						this.#reserve("episode", episode);
						this.db
							.prepare("DELETE FROM episode_sources WHERE episode=? AND revision=?")
							.run(episode.id, episode.revision);
						this.db
							.prepare("DELETE FROM episodes WHERE id=? AND revision=?")
							.run(episode.id, episode.revision);
						if (previous) this.search.replace(scope, "episode", previous);
						else this.search.remove(episode.id);
					}
					this.db.prepare("UPDATE spaces SET seq=seq+1 WHERE id=?").run(scope.space);
				}
				this.db
					.prepare(
						"UPDATE memory_operations SET result=json_set(result,'$.audit',json(?)) WHERE space=? AND digest=?",
					)
					.run(
						JSON.stringify({ world: scope.world, time: entry.time, state }),
						scope.space,
						key,
					);
				return 303;
			})
			.immediate();
	}
}
