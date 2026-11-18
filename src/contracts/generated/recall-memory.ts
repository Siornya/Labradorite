/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface RecallMemory {
	query: string;
	limit?: number;
	max_bytes?: number;
	kind?: "material" | "episode";
	review_status?: "pending" | "reviewed";
	/**
	 * happen selects episodes by possible overlap with the event range, excluding unknown times when a window is set. Empty query browses event times newest first. review selects episode revision time. received_at retains the existing mixed material/episode behavior.
	 */
	time_basis?: "received_at" | "authored_at" | "review" | "happen";
	from?: string;
	to?: string;
	channel?: string;
	thread?: string;
	before_seq?: string;
	/**
	 * Hybrid when configured; lexical forces local-only retrieval. Empty query never calls embedding.
	 */
	mode?: "hybrid" | "lexical";
}
