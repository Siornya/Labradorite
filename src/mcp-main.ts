import { loadRuntimeConfig } from "./runtime-config.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpBridge } from "./transport/mcp.js";
import { requireToken } from "./transport/daemon.js";
try {
	const server = createMcpBridge(
		requireToken(
			process.argv[2]
				? loadRuntimeConfig(process.argv[2]).token
				: process.env.FISH_MEMORY_TOKEN,
		),
	);
	await server.connect(new StdioServerTransport());
	process.stdin.once("end", () => {
		void server.close();
	});
} catch {
	console.error("Unable to start MCP bridge: check local service credentials.");
	process.exitCode = 1;
}
