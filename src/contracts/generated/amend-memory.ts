/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface AmendMemory {
	operation_id: string;
	base_seq: string;
	id: string;
	expected_revision: number;
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	append_source_ids?: [string, ...string[]];
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	append_beats?: [
		{
			text: string;
			/**
			 * @minItems 1
			 * @maxItems 32
			 */
			source_ids: [string, ...string[]];
		},
		...{
			text: string;
			/**
			 * @minItems 1
			 * @maxItems 32
			 */
			source_ids: [string, ...string[]];
		}[]
	];
	/**
	 * @maxItems 16
	 */
	append_interpretations?:
		| []
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ]
		| [
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				},
				{
					text: string;
					kind: "expressed" | "retrospective" | "inferred";
					/**
					 * @minItems 1
					 * @maxItems 32
					 */
					source_ids: [string, ...string[]];
				}
		  ];
	/**
	 * @maxItems 16
	 */
	append_unknowns?:
		| []
		| [string]
		| [string, string]
		| [string, string, string]
		| [string, string, string, string]
		| [string, string, string, string, string]
		| [string, string, string, string, string, string]
		| [string, string, string, string, string, string, string]
		| [string, string, string, string, string, string, string, string]
		| [string, string, string, string, string, string, string, string, string]
		| [string, string, string, string, string, string, string, string, string, string]
		| [string, string, string, string, string, string, string, string, string, string, string]
		| [
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string
		  ]
		| [
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string
		  ]
		| [
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string
		  ]
		| [
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string
		  ]
		| [
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string
		  ];
	title?: string;
	summary?: string;
	thread?: string | null;
	activity_state?: "active" | "paused" | "completed" | "abandoned" | "unknown";
	dry_run?: boolean;
}
