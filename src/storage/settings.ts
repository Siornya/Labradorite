import type Database from "better-sqlite3";
import type { ReviewSetting } from "../contracts/generated/review-setting.js";
import { MaterialError, type MemoryScope } from "./materials.js";

export type SettingMode = "owner" | "autonomous";
type SettingState = "proposed" | "unreviewed" | "checked" | "rejected" | "undone";
export interface SettingChange {
	id: string;
	version: string;
	base: string | null;
	target: "character" | "world";
	world: string;
	title: string;
	body: string;
	mode: SettingMode;
	state: SettingState;
	author: "owner" | "model";
	time: string;
	reason: string;
	source_ids: string[];
	episodes: ReviewSetting["episodes"][number][];
}

export function settingMode(value: unknown): SettingMode {
	if (value !== "owner" && value !== "autonomous") throw new MaterialError("VALIDATION_ERROR");
	return value;
}

// Rows arrive newest first. A pending or withdrawn change never becomes current by reading it.
export function effectiveSettings(rows: SettingChange[]) {
	const active = new Map<string, SettingChange>();
	for (const row of rows) {
		if ((row.state === "checked" || row.state === "unreviewed") && !active.has(row.id))
			active.set(row.id, row);
	}
	return [...active.values()];
}

export class SettingLog {
	constructor(private readonly db: Database.Database) {}

	history(scope: MemoryScope): SettingChange[] {
		const rows = this.db
			.prepare(`SELECT o.result FROM memory_operations o
			JOIN spaces s ON s.id=o.space WHERE o.kind='setting' AND o.space=? AND s.character=?
			AND (json_extract(result,'$.world')=? OR json_extract(result,'$.target')='character')
			ORDER BY o.rowid DESC`)
			.all(scope.space, scope.character, scope.world) as { result: string }[];
		return rows.map((r) => JSON.parse(r.result) as SettingChange);
	}

	context(scope: MemoryScope) {
		const history = this.history(scope);
		const describe = ({ id, version, target, title, body, mode }: SettingChange) => ({
			id,
			version,
			target,
			title,
			body,
			mode,
		});
		return {
			settings: effectiveSettings(history).map(describe),
			owner_decisions: history
				.filter(
					(r) => r.author === "model" && (r.state === "rejected" || r.state === "undone"),
				)
				.map((r) => ({ ...describe(r), decision: r.state })),
		};
	}

	detail(scope: MemoryScope, version: string) {
		return this.db.transaction(() => {
			const history = this.history(scope);
			const row = history.find((r) => r.version === version);
			if (!row) throw new MaterialError("NOT_FOUND");
			const lookup = this.db.prepare(
				"SELECT json_extract(body,'$.title') AS title FROM episodes WHERE space=? AND world=? AND id=? AND revision=?",
			);
			const evidence =
				row.world !== scope.world
					? []
					: row.episodes.map((ref) => ({
							...ref,
							...(lookup.get(scope.space, scope.world, ref.id, ref.revision) as
								| { title: string }
								| undefined),
						}));
			return {
				row,
				before: history.find((r) => r.version === row.base),
				current: effectiveSettings(history).find((r) => r.id === row.id),
				evidence,
			};
		})();
	}

	act(scope: MemoryScope, version: string, action: string, mode: string | null) {
		this.db
			.transaction(() => {
				const rows = this.history(scope);
				const row = rows.find((r) => r.version === version);
				if (!row) throw new MaterialError("NOT_FOUND");
				const active = effectiveSettings(rows).find((r) => r.id === row.id);
				switch (action) {
					case "approve":
						if (row.state !== "proposed" || (active?.version ?? null) !== row.base)
							throw new MaterialError("REVISION_CONFLICT");
						row.mode = settingMode(mode);
						row.state = "checked";
						break;
					case "reject":
						if (row.state !== "proposed") throw new MaterialError("REVISION_CONFLICT");
						row.state = "rejected";
						break;
					case "check":
						if (row.state !== "unreviewed")
							throw new MaterialError("REVISION_CONFLICT");
						row.state = "checked";
						break;
					case "undo":
						if (active?.version !== version)
							throw new MaterialError("REVISION_CONFLICT");
						row.state = "undone";
						break;
					default:
						throw new MaterialError("VALIDATION_ERROR");
				}
				this.db
					.prepare(
						"UPDATE memory_operations SET result=? WHERE space=? AND kind='setting' AND json_extract(result,'$.version')=?",
					)
					.run(JSON.stringify(row), scope.space, version);
				this.db.prepare("UPDATE spaces SET seq=seq+1 WHERE id=?").run(scope.space);
			})
			.immediate();
	}

	// Removing a source must also erase derived text in later versions, including rejected drafts.
	affected(scope: MemoryScope, episodes: Set<string>, sources: Set<string>) {
		const versions = new Set<string>();
		for (const row of this.history(scope).reverse()) {
			if (
				(row.base && versions.has(row.base)) ||
				row.episodes.some((e) => episodes.has(e.id)) ||
				row.source_ids.some((id) => sources.has(id))
			)
				versions.add(row.version);
		}
		return [...versions];
	}

	erase(scope: MemoryScope, versions: string[]) {
		this.db
			.prepare(`UPDATE memory_operations SET result='{"audit":{"state":"undone"}}'
			WHERE kind='setting' AND space=? AND json_extract(result,'$.version') IN (SELECT value FROM json_each(?))`)
			.run(scope.space, JSON.stringify(versions));
	}
}
