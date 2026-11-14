import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { EmbeddingProvider } from "./providers/embedding.js";
import { runtimeProvider } from "./providers/local-embedding.js";
import { loadRuntimeConfig, type RuntimeConfig } from "./runtime-config.js";
import { serveViewerSearch } from "./viewer-search.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMemoryServer } from "./transport/mcp.js";
import { MaterialStore } from "./storage/materials.js";

let viewer: ChildProcess | undefined;
let stopped = false;
const providers = new Map<string, EmbeddingProvider | undefined>();
function getProvider(config: RuntimeConfig) {
	const key = JSON.stringify([config.embedding, config.local_model]);
	if (!providers.has(key)) providers.set(key, runtimeProvider(config));
	return providers.get(key);
}
let store: MaterialStore | undefined;
function closeStore() {
	stopped = true;
	for (const provider of providers.values()) provider?.close?.();
	providers.clear();
	if (viewer?.connected) viewer.disconnect();
	viewer = undefined;
	const current = store;
	store = undefined;
	current?.close();
}
try {
	const args = process.argv.slice(2);
	const paths = args.filter((arg) => arg !== "--no-webview");
	if (paths.length !== 1 || paths[0]!.startsWith("--"))
		throw new Error("Usage: mcp-main runtime.json [--no-webview]");
	const runtime = paths[0]!;
	const config = loadRuntimeConfig(runtime);
	store = new MaterialStore(config.database, undefined, getProvider(config));
	const server = createMemoryServer({
		store,
		scope: { space: config.space, character: config.character, world: config.world },
		principal: "local-client",
		database: config.database,
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
	if (!stopped && !args.includes("--no-webview")) {
		const desktop =
			!process.env.SSH_CONNECTION &&
			!process.env.SSH_TTY &&
			(process.platform === "darwin" ||
				(process.platform === "win32" &&
					process.env.SESSIONNAME?.toLowerCase() !== "services") ||
				!!process.env.DISPLAY ||
				!!process.env.WAYLAND_DISPLAY);
		viewer = fork(
			fileURLToPath(new URL("./viewer.js", import.meta.url)),
			[runtime, ...(desktop ? ["--open"] : [])],
			{
				stdio: ["ignore", 2, 2, "ipc"],
				windowsHide: true,
				execArgv: [],
			},
		);
		viewer.on("error", () => console.error("Unable to start the memory viewer."));
		serveViewerSearch(viewer, (config) => {
			if (stopped) throw new Error("MCP is closing");
			return getProvider(config);
		});
	}
} catch {
	closeStore();
	console.error("Unable to start memory MCP: check configuration, database path and scope.");
	process.exitCode = 1;
}
