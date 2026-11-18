/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

export interface ReviewEpisode {
	/**
	 * Associate the saved episode revision with a person in the same transaction. Create with name and identity or update with id and expected_revision. Include a complete impression only when understanding changes.
	 */
	person_review?: {
		name?: string;
		identity?: string;
		id?: string;
		expected_revision?: number;
		impression?: string;
		/**
		 * @maxItems 31
		 */
		other_episodes?: {
			id: string;
			revision: number;
		}[];
	};
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
