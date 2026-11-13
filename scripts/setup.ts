import {
	mkdirSync,
	existsSync,
	statSync,
	writeFileSync,
	copyFileSync,
	constants,
	renameSync,
	rmSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeConfig, type RuntimeConfig } from "@/runtime-config.js";
import { configureEmbedding } from "./setup-embedding.js";
import { prepareDataDirectory } from "@/data-directory.js";

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		embedding: { type: "string" },
		model: { type: "string" },
		endpoint: { type: "string" },
		"api-key-env": { type: "string" },
	},
});
if (positionals.length > 1)
	throw new Error("用法：vpr setup [data-dir] [--embedding local|external|lexical]");
const serverPath = fileURLToPath(new URL("../dist/src/mcp-main.js", import.meta.url));
if (!statSync(serverPath, { throwIfNoEntry: false })?.isFile()) {
	console.error("未找到 MCP 服务构建产物。请先在项目根目录运行 vpr build，再运行 vpr setup。");
	process.exit(1);
}
const directory = await prepareDataDirectory(positionals[0]);
mkdirSync(directory, { recursive: true, mode: 0o700 });
const configPath = join(directory, "runtime.json");
const existing = existsSync(configPath);
const runtime: RuntimeConfig = existing
	? loadRuntimeConfig(configPath)
	: {
			database: join(directory, "memory-v2.db"),
			space: "local",
			character: "character",
			world: "real",
		};
const previous = JSON.stringify(runtime);
if (!existing || Object.keys(values).length) await configureEmbedding(runtime, values);
if (!existing || previous !== JSON.stringify(runtime)) {
	if (existing && JSON.parse(previous).embedding)
		console.info("已更改 embedding 配置。切换向量空间后请重新建立索引。");
	const temp = configPath + "." + randomUUID() + ".tmp";
	try {
		writeFileSync(temp, JSON.stringify(runtime, null, "\t") + "\n", {
			mode: 0o600,
			flag: "wx",
		});
		loadRuntimeConfig(temp);
		if (existing) renameSync(temp, configPath);
		else copyFileSync(temp, configPath, constants.COPYFILE_EXCL);
	} finally {
		rmSync(temp, { force: true });
	}
}
mkdirSync(runtime.database + ".inbox", { recursive: true, mode: 0o700 });
const mcp = {
	mcpServers: {
		Labradorite: {
			command: process.execPath,
			args: [serverPath, configPath],
		},
	},
};
const mcpPath = join(directory, "mcp.json");
writeFileSync(mcpPath, JSON.stringify(mcp, null, "\t") + "\n", { mode: 0o600 });
console.info(`运行配置：${configPath}`);
console.info(`MCP 客户端配置：${mcpPath}`);
console.info(
	"请将 mcp.json 中的 Labradorite 条目加入 MCP 客户端配置，然后重新加载客户端。服务由客户端启动和管理。更多内容见 README。",
);
