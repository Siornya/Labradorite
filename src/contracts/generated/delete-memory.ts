/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface DeleteMemory {
	operation_id: string;
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	source_ids: [string, ...string[]];
}
