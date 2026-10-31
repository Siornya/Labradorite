import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig } from "./runtime-config.js";

const directory = resolve(
	process.argv[2] ??
		join(process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"), "fish-memory-test"),
);
mkdirSync(directory, { recursive: true, mode: 0o700 });
const configPath = join(directory, "runtime.json");
if (!existsSync(configPath)) {
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				database: join(directory, "memory-v2.db"),
				space: "local",
				character: "character",
				world: "real",
			},
			null,
			"\t",
		) + "\n",
		{ flag: "wx", mode: 0o600 },
	);
}
loadRuntimeConfig(configPath);
const mcp = {
	mcpServers: {
		"fish-memory": {
			command: process.execPath,
			args: [fileURLToPath(new URL("./mcp-main.js", import.meta.url)), configPath],
		},
	},
};
const mcpPath = join(directory, "mcp.json");
writeFileSync(mcpPath, JSON.stringify(mcp, null, "\t") + "\n", { mode: 0o600 });
console.info(`Runtime configuration: ${configPath}`);
console.info(`MCP client configuration: ${mcpPath}`);
console.info(
	"Add fish-memory from the MCP configuration to your client; it owns the server process.",
);
