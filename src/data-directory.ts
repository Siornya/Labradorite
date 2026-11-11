import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { loadRuntimeConfig } from "./runtime-config.js";
import { activeViewers } from "./viewer-registry.js";

const pendingConfig = ".runtime-directory-migration.json";

export function defaultDataDirectory() {
	const base = process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share");
	return resolve(base, "labradorite");
}

export async function prepareDataDirectory(requested?: string) {
	const current = defaultDataDirectory();
	const legacy = resolve(current, "..", "fish-memory-test");
	const selected = resolve(requested ?? current);
	if (relative(selected, current) !== "" && relative(selected, legacy) !== "") return selected;
	const original = join(legacy, "runtime.json");
	if (existsSync(original)) {
		if (existsSync(current))
			throw new Error("新旧数据目录同时存在。请先备份并整理目录，setup 不会合并或覆盖数据。");
		if (!lstatSync(legacy).isDirectory())
			throw new Error("旧数据目录必须是普通目录，请手动迁移符号链接指向的数据。");
		const config = loadRuntimeConfig(original);
		if (
			["-wal", "-shm", "-journal"].some((suffix) => existsSync(config.database + suffix)) ||
			(await activeViewers()).some((viewer) => resolve(viewer.runtime) === original)
		)
			throw new Error("迁移前请停止 MCP 服务和查看器；数据库仍在使用或尚未正常关闭。");
		const relocate = (path: string) => {
			const inside = relative(legacy, path);
			return inside === ".." || inside.startsWith(".." + sep) || isAbsolute(inside)
				? path
				: join(current, inside);
		};
		config.database = relocate(config.database);
		if (config.local_model) config.local_model.file = relocate(config.local_model.file);
		const pending = join(legacy, pendingConfig);
		// A complete configuration records the move before renaming the directory.
		// A later setup can finish publishing it if the process stops between the two renames.
		const temp = pending + "." + randomUUID() + ".tmp";
		try {
			writeFileSync(temp, JSON.stringify(config, null, "\t") + "\n", {
				mode: 0o600,
				flag: "wx",
			});
			loadRuntimeConfig(temp);
			renameSync(temp, pending);
		} finally {
			rmSync(temp, { force: true });
		}
		renameSync(legacy, current);
	}
	const pending = join(current, pendingConfig);
	if (existsSync(pending)) {
		loadRuntimeConfig(pending);
		renameSync(pending, join(current, "runtime.json"));
		console.info(
			"旧数据目录已迁移到 " + current + "。请用新生成的 mcp.json 替换客户端中的旧配置。",
		);
	}
	return current;
}
