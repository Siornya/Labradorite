import { isDeepStrictEqual } from "node:util";
import type { Episode } from "./materials.js";

/** Normalize persisted v4 episode fields at the read boundary. Writes use current names. */
export function readEpisodeBody(body: string): Episode {
	const { recorded_at, happened_at, ...episode } = JSON.parse(body) as Episode & {
		recorded_at?: string;
		happened_at?: Episode["happen"];
	};
	const happen = episode.happen ?? happened_at;
	return {
		...episode,
		review: episode.review ?? recorded_at!,
		...(happen ? { happen } : {}),
	};
}

const reviewFields = [
	"title",
	"summary",
	"source_ids",
	"beats",
	"interpretations",
	"thread",
	"activity_state",
	"unknowns",
	"happen",
] as const;
type ReviewContent = Pick<Episode, (typeof reviewFields)[number]>;

export function episodeChanges(before: ReviewContent | undefined, after: ReviewContent) {
	return reviewFields
		.filter((key) => !isDeepStrictEqual(before?.[key] ?? null, after[key] ?? null))
		.map((field) => ({ field, before: before?.[field] ?? null, after: after[field] ?? null }));
}
