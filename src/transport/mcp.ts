import organizeSchema from "../contracts/schemas/organize-memory.json" with { type: "json" };
import recallSchema from "../contracts/schemas/recall-memory.json" with { type: "json" };
import deleteSchema from "../contracts/schemas/delete-memory.json" with { type: "json" };
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import submitSchema from "../contracts/schemas/submit-material.json" with { type: "json" };
import { DAEMON_PORT, requireToken } from "./daemon.js";
export function createMcpBridge(token: string) {
	requireToken(token);
	const server = new Server(
		{ name: "fish-memory", version: "0.0.0" },
		{ capabilities: { tools: {} } },
	);
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			{
				name: "memory_recall",
				description:
					"Find original materials and organized experiences using lexical cues. Empty query lists recent candidates. Returns snapshot_seq for organization. Search coverage can be partial; absence is not proof an event never happened.",
				inputSchema: { ...recallSchema, type: "object" as const },
			},
			{
				name: "memory_organize",
				description:
					"Save or revise an evidence-linked experience. First recall/read sources and use snapshot_seq as base_seq. Preserve process, original views and later changes. Never invent experiences. All listed sources must be readable; expressed interpretations require character-statement sources. Revisions require id and expected_revision. On stale/conflict, re-read before proposing again.",
				inputSchema: { ...organizeSchema, type: "object" as const },
			},
			{
				name: "memory_delete",
				description:
					"Delete specified original material IDs and all dependent experience revisions. Use only for explicitly requested deletion. Online deletion does not erase external copies or backups.",
				inputSchema: { ...deleteSchema, type: "object" as const },
				annotations: { destructiveHint: true },
			},

			{
				name: "memory_status",
				description: "Check available local memory capabilities.",
				inputSchema: {
					type: "object" as const,
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "memory_submit",
				description:
					"Persist original material. Supply a stable operation_id for retries. Source and speaker are reports, not verified facts. Coverage must describe what was actually read, seen or attempted. Does not organize memory.",
				inputSchema: { ...submitSchema, type: "object" as const },
			},
			{
				name: "memory_read",
				description: "Read original material by ID within the server-authorized scope.",
				inputSchema: {
					type: "object" as const,
					properties: {
						id: { type: "string", minLength: 1, maxLength: 128 },
						kind: { enum: ["material", "episode"] },
					},
					required: ["id"],
					additionalProperties: false,
				},
			},
		],
	}));
	server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
		const args = params.arguments ?? {};
		let path: string;
		let method = "GET";
		if (["memory_recall", "memory_organize", "memory_delete"].includes(params.name)) {
			path = `/v1/${params.name.slice(7)}`;
			method = "POST";
		} else if (params.name === "memory_submit") {
			path = "/v1/materials";
			method = "POST";
		} else if (
			params.name === "memory_read" &&
			typeof args.id === "string" &&
			args.id.length > 0 &&
			args.id.length <= 128 &&
			Object.keys(args).every((key) => ["id", "kind"].includes(key)) &&
			(args.kind === undefined || args.kind === "material" || args.kind === "episode")
		)
			path = `/v1/${args.kind === "episode" ? "episodes" : "materials"}/${encodeURIComponent(args.id)}`;
		else if (params.name === "memory_status" && Object.keys(args).length === 0)
			path = "/v1/capabilities";
		else
			return {
				content: [{ type: "text" as const, text: "invalid_tool_arguments" }],
				isError: true,
			};
		try {
			const response = await fetch(`http://127.0.0.1:${DAEMON_PORT}${path}`, {
				method,
				headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
				...(method === "POST" ? { body: JSON.stringify(args) } : {}),
				signal: AbortSignal.timeout(3000),
				redirect: "error",
			});
			let text: string;
			if (response.status === 401) {
				await response.body?.cancel();
				text = "service_access_failed";
			} else if (response.status === 404 && params.name === "memory_status") {
				await response.body?.cancel();
				text = "memory_capabilities_not_implemented";
			} else text = await response.text();
			return { content: [{ type: "text" as const, text }], isError: !response.ok };
		} catch {
			return {
				content: [{ type: "text" as const, text: "headless_service_unavailable" }],
				isError: true,
			};
		}
	});
	return server;
}
