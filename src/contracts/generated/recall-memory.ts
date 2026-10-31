/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface RecallMemory {
	query: string;
	limit?: number;
	max_bytes?: number;
	kind?: "material" | "episode";
	organization_status?: "pending" | "organized";
	time_basis?: "received_at" | "authored_at";
	from?: string;
	to?: string;
	channel?: string;
	thread?: string;
	before_seq?: string;
}
