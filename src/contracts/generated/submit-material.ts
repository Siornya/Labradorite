/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface SubmitMaterial {
	operation_id: string;
	text: string;
	source_kind: "user_report" | "character_statement" | "activity_report";
	speaker: string;
	coverage: string;
	authored_at?: string | null;
	corrects?: string;
}
