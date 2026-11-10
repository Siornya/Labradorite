/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface ReviewPerson {
	operation_id: string;
	base_seq: string;
	id?: string;
	expected_revision?: number;
	name?: string;
	identity?: string;
	impression?: string;
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	episodes: [
		{
			id: string;
			revision: number;
		},
		...{
			id: string;
			revision: number;
		}[]
	];
}
