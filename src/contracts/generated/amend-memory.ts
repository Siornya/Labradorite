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
	/**
	 * Event occurrence, independent of recording time. Omission preserves the existing value on revision; use kind=unknown to clear. Point means an event somewhere within the stated precision, not a duration. Known times require source_ids and basis. Calendar dates require utc_offset. Interval may have one unknown endpoint.
	 */
	happen?: {
		kind: "unknown" | "point" | "interval";
		start?: {
			value: string;
			precision: "year" | "month" | "day" | "second" | "millisecond";
		};
		end?: {
			value: string;
			precision: "year" | "month" | "day" | "second" | "millisecond";
		};
		utc_offset?: string;
		description?: string;
		basis?: "stated" | "inferred";
		/**
		 * @minItems 1
		 * @maxItems 32
		 */
		source_ids?: [string, ...string[]];
	};
}
