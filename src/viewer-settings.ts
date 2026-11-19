import { createHash, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { renameSync, rmSync, writeFileSync } from "node:fs";
import { loadRuntimeConfig, type RuntimeConfig } from "./runtime-config.js";

export function libraryMatches(a: RuntimeConfig, b: RuntimeConfig) {
	return (
		a.database === b.database &&
		a.space === b.space &&
		a.world === b.world &&
		a.character === b.character
	);
}

export function settingsPage(path: string, selected: RuntimeConfig, form?: URLSearchParams) {
	if (!form) return readOrSave(path, selected);
	// A stable SQLite lock file serializes writers and releases its lock on process exit.
	try {
		const lock = new Database(path + ".lock");
		try {
			return lock.transaction(() => readOrSave(path, selected, form)).immediate();
		} finally {
			lock.close();
		}
	} catch {
		return { status: 503, error: "暂时无法锁定运行配置，请稍后重试。" };
	}
}

function readOrSave(path: string, selected: RuntimeConfig, form?: URLSearchParams) {
	const message = (status: number, text: string) => ({
		status,
		error: text,
	});
	let current: RuntimeConfig;
	try {
		current = loadRuntimeConfig(path);
	} catch {
		return message(409, "无法读取运行配置，请检查配置文件。");
	}
	if (!libraryMatches(current, selected))
		return message(409, "运行配置指向的记忆库或作用域已更改，请重新选择。");
	const revision = createHash("sha256")
		.update(JSON.stringify([path, current]))
		.digest("hex");
	if (form) {
		const keys = ["revision", "idle", ...(current.embedding ? ["budget"] : [])];
		if (form.get("revision") !== revision)
			return message(409, "设置已变更，请重新加载后再保存。");
		if (
			keys.some((key) => form.getAll(key).length !== 1) ||
			[...form.keys()].some((key) => !keys.includes(key))
		)
			return message(400, "提交的设置字段无效。");
		const number = (key: string) =>
			/^\d+$/.test(form.get(key)!) ? Number(form.get(key)) : NaN;
		const idle = number("idle");
		const budget = number("budget");
		if (!Number.isSafeInteger(idle) || idle < 1 || idle > 35791)
			return message(400, "空闲时长须为 1 至 35791 分钟的整数。");
		if (current.embedding && (!Number.isSafeInteger(budget) || budget < 0 || budget > 100000))
			return message(400, "每日请求上限须为 0 至 100000 的整数。");
		current.index_idle_minutes = idle;
		if (current.embedding) current.embedding.max_requests_per_day = budget;
		const temp = path + "." + randomUUID() + ".tmp";
		try {
			writeFileSync(temp, JSON.stringify(current, null, "\t") + "\n", {
				flag: "wx",
				mode: 0o600,
			});
			renameSync(temp, path);
		} catch {
			return message(500, "保存失败，请检查配置目录的写入权限。");
		} finally {
			rmSync(temp, { force: true });
		}
		return { status: 303 };
	}
	return {
		status: 200,
		revision,
		idle: current.index_idle_minutes ?? 120,
		budget: current.embedding?.max_requests_per_day,
	};
}
