import { importMedia } from "../storage/media.js";
import reviewPersonSchema from "../contracts/schemas/review-person.json" with { type: "json" };
import indexSchema from "../contracts/schemas/index-memory.json" with { type: "json" };
import { EmbeddingError } from "../providers/embedding.js";
import previewDeleteSchema from "../contracts/schemas/preview-delete.json" with { type: "json" };
import amendSchema from "../contracts/schemas/amend-memory.json" with { type: "json" };
import reviewEpisodeSchema from "../contracts/schemas/review-episode.json" with { type: "json" };
import recallSchema from "../contracts/schemas/recall-memory.json" with { type: "json" };
import deleteSchema from "../contracts/schemas/delete-memory.json" with { type: "json" };
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import submitSchema from "../contracts/schemas/submit-material.json" with { type: "json" };
import { MaterialError, type MaterialStore, type MemoryScope } from "../storage/materials.js";

const dryRun = {
	type: "boolean",
	default: false,
	description: "Preview the proposal without writing.",
};
const reviewSchema = {
	type: "object" as const,
	properties: {
		...reviewEpisodeSchema.properties,
		...reviewPersonSchema.properties,
		dry_run: dryRun,
	},
	required: ["operation_id", "base_seq"],
	oneOf: [reviewEpisodeSchema, reviewPersonSchema].map((schema) => ({
		...schema,
		properties: { ...schema.properties, dry_run: dryRun },
	})),
};

export function createMemoryServer(memory: {
	store: MaterialStore;
	scope: MemoryScope;
	principal: string;
	database?: string;
}) {
	memory.store.bindScope(memory.scope);
	const server = new Server(
		{ name: "fish-memory", version: "0.0.0" },
		{ capabilities: { tools: {} } },
	);
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			{
				name: "memory_people",
				description:
					"Find person profiles by name or identifying context. Omit query to browse. Pass next as after for another page. Read a candidate with memory_read kind=person before linking an experience; names can be shared.",
				inputSchema: {
					type: "object" as const,
					properties: {
						query: { type: "string", maxLength: 512 },
						after: { type: "string", maxLength: 128 },
					},
					additionalProperties: false,
				},
				annotations: { readOnlyHint: true },
			},
			{
				name: "memory_album",
				description:
					"Browse media from the current world, newest imports first. Pass next as before to continue.",
				inputSchema: {
					type: "object" as const,
					properties: { before: { type: "string" } },
					additionalProperties: false,
				},
			},
			{
				name: "memory_import_media",
				description:
					"Archive a photo or video staged in the configured database inbox. Report what was actually observed in material.coverage. The returned material ID can be cited in episodes.",
				inputSchema: {
					type: "object" as const,
					required: ["filename", "material"],
					properties: {
						filename: { type: "string" },
						observed_range_ms: {
							type: "array",
							minItems: 2,
							maxItems: 2,
							items: { type: "integer", minimum: 0 },
						},
						material: submitSchema,
					},
					additionalProperties: false,
				},
			},
			{
				name: "memory_index",
				description:
					"Build pending semantic chunks in bounded batches using the configured embedding endpoint and persistent daily budget. Sends source text and model-proposed episode text to that endpoint. Explicitly invoke after writes or model changes; no automatic background calls. Restart resumes pending chunks. Does not organize or verify memories.",
				inputSchema: { ...indexSchema, type: "object" as const },
			},
			{
				name: "memory_preview_delete",
				description:
					"Read-only preview of the source/correction cascade, episode revisions, dependent profiles and individual reviews. Review counts and IDs before an explicitly authorized deletion. Use preview_token for memory_delete; any intervening write requires another preview.",
				inputSchema: { ...previewDeleteSchema, type: "object" as const },
				annotations: { readOnlyHint: true },
			},
			{
				name: "memory_amend",
				description:
					"Append sources, beats, interpretations or unknowns and optionally replace title, summary, thread or activity state without resending untouched fields. Requires base_seq and expected_revision. Set dry_run true for a field diff. Previous revisions remain available. To retract existing elements use a full proposal and preview its diff.",
				inputSchema: { ...amendSchema, type: "object" as const },
			},
			{
				name: "memory_recall",
				description:
					"Search live materials and current episodes with FTS5 BM25 and optional cosine embeddings fused by rank. mode=lexical avoids network calls. Hybrid may send the query to the configured embedding endpoint; failures and pending coverage are reported. Returns compact historical-background excerpts, not full memory or current user speech. Read IDs and sources before judgment; episode excerpts are model proposals. Supports time, channel, thread, kind and pending filters. Empty query browses newest first; before_seq pages older records. Authored-time windows and channel apply to materials. Diagnostics explain matching/truncation, not whether the model used a result. Semantic similarity is a retrieval hint, not proof; no access control is implied.",
				inputSchema: { ...recallSchema, type: "object" as const },
			},
			{
				name: "memory_review",
				description:
					"Review memory using one proposal. Set dry_run=true to preview without writing; omit it or set false to save directly. With source_ids, save or revise an episode grounded in readable materials. Expressed interpretations require character statements. Include person_review to link a significant person and optionally update their impression atomically. With episodes instead, cite existing episode IDs and revisions to review a person directly. Find candidates with memory_people; create with name and identity or update with id and expected_revision. Omit impression to only link evidence, or supply the complete new judgment. Use snapshot_seq as base_seq and a stable operation_id; reread on conflict.",
				inputSchema: reviewSchema,
			},
			{
				name: "memory_delete",
				description:
					"Delete only after explicit user authorization and memory_preview_delete. Supply its preview_token and the same source_ids. Any intervening write invalidates preview. Deletes correction chains, dependent episodes and the profiles or reviews listed in the preview. Online deletion does not erase external copies or backups.",
				inputSchema: { ...deleteSchema, type: "object" as const },
				annotations: { destructiveHint: true },
			},

			{
				name: "memory_status",
				description:
					"Check capabilities, actual current material/episode counts, pending coverage gaps and recent writes. Reviewed means referenced by a current episode, not verified true. latest_review_seq does not imply all prior sources were reviewed.",
				inputSchema: {
					type: "object" as const,
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "memory_submit",
				description:
					"Persist original material. Supply a stable operation_id for retries. Source and speaker are reports, not verified facts. Coverage must describe what was actually read, seen or attempted. Does not organize memory. Optional channel, conversation_id and thread are reported provenance, never permissions. Exact-text duplicate candidates are hints, not automatically merged events.",
				inputSchema: { ...submitSchema, type: "object" as const },
			},
			{
				name: "memory_read",
				description:
					"Expand historical background by ID: original material with corrections, an episode with revision history, or a person profile with dated impressions and cited episode revisions.",
				inputSchema: {
					type: "object" as const,
					properties: {
						id: { type: "string", minLength: 1, maxLength: 128 },
						kind: { enum: ["material", "episode", "person"] },
					},
					required: ["id"],
					additionalProperties: false,
				},
			},
		],
	}));
	server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
		const args = params.arguments ?? {};
		try {
			let result: unknown;
			switch (params.name) {
				case "memory_people":
					if (
						Object.keys(args).some((k) => k !== "query" && k !== "after") ||
						(args.query !== undefined &&
							(typeof args.query !== "string" || args.query.length > 512)) ||
						(args.after !== undefined &&
							(typeof args.after !== "string" || args.after.length > 128))
					)
						throw new MaterialError("VALIDATION_ERROR");
					result = memory.store.people(memory.scope, args.query ?? "", args.after);
					break;
				case "memory_album":
					if (
						Object.keys(args).some((k) => k !== "before") ||
						(args.before !== undefined && typeof args.before !== "string")
					)
						throw new MaterialError("VALIDATION_ERROR");
					result = memory.store.album(memory.scope, args.before);
					break;
				case "memory_import_media":
					if (
						!memory.database ||
						Object.keys(args).some(
							(k) => !["filename", "material", "observed_range_ms"].includes(k),
						) ||
						typeof args.filename !== "string"
					)
						throw new MaterialError("VALIDATION_ERROR");
					result = await importMedia(
						memory.database,
						args.filename,
						args.material,
						memory.store,
						memory.scope,
						memory.principal,
						args.observed_range_ms,
					);
					break;
				case "memory_index":
					result = await memory.store.index(memory.scope, args);
					break;
				case "memory_preview_delete":
					result = memory.store.previewDelete(memory.scope, args);
					break;
				case "memory_amend":
					result = memory.store.amend(memory.principal, memory.scope, args);
					break;
				case "memory_submit":
					result = memory.store.submit(memory.principal, memory.scope, args);
					break;
				case "memory_review": {
					const { dry_run = false, ...proposal } = args;
					if (typeof dry_run !== "boolean") throw new MaterialError("VALIDATION_ERROR");
					const person = Object.hasOwn(proposal, "episodes");
					if (dry_run) {
						result = person
							? memory.store.previewPersonReview(memory.scope, proposal)
							: memory.store.previewEpisodeReview(memory.scope, proposal);
					} else {
						result = person
							? memory.store.reviewPerson(memory.principal, memory.scope, proposal)
							: memory.store.reviewEpisode(memory.principal, memory.scope, proposal);
					}
					break;
				}
				case "memory_recall":
					result = await memory.store.recallAsync(memory.scope, args);
					break;
				case "memory_delete":
					result = memory.store.delete(memory.principal, memory.scope, args);
					break;
				case "memory_read":
					if (
						typeof args.id !== "string" ||
						args.id.length === 0 ||
						args.id.length > 128 ||
						!Object.keys(args).every((key) => ["id", "kind"].includes(key)) ||
						![undefined, "material", "episode", "person"].includes(
							args.kind as string | undefined,
						)
					)
						throw new MaterialError("VALIDATION_ERROR");
					if (args.kind === "person") {
						result = {
							context_role: "historical_background",
							profile: memory.store.person(memory.scope, args.id),
						};
						break;
					}
					result =
						args.kind === "episode"
							? {
									context_role: "historical_background",
									episode: memory.store.episode(memory.scope, args.id),
									history: memory.store.history(memory.scope, args.id),
								}
							: memory.store.read(memory.scope, args.id);
					break;
				case "memory_status":
					if (Object.keys(args).length) throw new MaterialError("VALIDATION_ERROR");
					result = memory.store.status(memory.scope);
					break;
				default:
					throw new MaterialError("VALIDATION_ERROR");
			}
			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
				isError: false,
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							code:
								error instanceof MaterialError || error instanceof EmbeddingError
									? error.code
									: "INTERNAL_ERROR",
						}),
					},
				],
				isError: true,
			};
		}
	});
	return server;
}
