/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface OrganizeMemory {
	operation_id: string;
	base_seq: string;
	id?: string;
	expected_revision?: number;
	title: string;
	summary: string;
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	source_ids: [string, ...string[]];
	/**
	 * @minItems 1
	 * @maxItems 32
	 */
	beats: [
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
	interpretations:
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
	thread: string | null;
	activity_state: "active" | "paused" | "completed" | "abandoned" | "unknown";
	/**
	 * @maxItems 16
	 */
	unknowns:
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
}
