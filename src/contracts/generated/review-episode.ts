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
}
