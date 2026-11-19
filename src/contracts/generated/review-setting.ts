/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface ReviewSetting {
	operation_id: string;
	base_seq: string;
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
	reason: string;
	setting: {
		target: "character" | "world";
		title: string;
		body: string;
		id?: string;
		expected_version?: string;
	};
}
