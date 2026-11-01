import { CompatibleEmbeddingProvider } from "./providers/embedding.js";
import { loadRuntimeConfig } from "./runtime-config.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMemoryServer } from "./transport/mcp.js";
import { MaterialStore } from "./storage/materials.js";

let store: MaterialStore | undefined;
function closeStore() {
	const current = store;
	store = undefined;
	current?.close();
}
try {
	if (process.argv.length !== 3) throw new Error("Runtime configuration required.");
	const config = loadRuntimeConfig(process.argv[2]!);
	store = new MaterialStore(
		config.database,
		undefined,
		config.embedding ? new CompatibleEmbeddingProvider(config.embedding) : undefined,
	);
	const server = createMemoryServer({
		store,
		scope: { space: config.space, character: config.character, world: config.world },
		principal: "local-client",
	});
	let closing: Promise<void> | undefined;
	const close = () =>
		(closing ??= (async () => {
			try {
				await server.close();
			} finally {
				closeStore();
			}
		})());
	server.onclose = () => {
		closeStore();
	};
	for (const signal of ["SIGINT", "SIGTERM"] as const)
		process.once(signal, () => {
			void close();
		});
	process.stdin.once("end", () => {
		void close();
	});
	await server.connect(new StdioServerTransport());
} catch {
	closeStore();
	console.error("Unable to start memory MCP: check configuration, database path and scope.");
	process.exitCode = 1;
}
