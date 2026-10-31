/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

/**
 * Process liveness only; this response does not indicate memory service readiness.
 */
export interface LivenessResponse {
	status: "alive";
	stage: "P0-A";
	checked_at: string;
}
