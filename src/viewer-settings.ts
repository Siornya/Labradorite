import { createHash, randomUUID } from "node:crypto";
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
	const message = (status: number, text: string) => ({
		status,
		html: `<h1>设置</h1><p role="alert">${text}</p><p><a href="/settings">重新加载设置</a> · <a href="/choose">选择记忆库</a></p>`,
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
		return { status: 303, html: "" };
	}
	return {
		status: 200,
		html: `<h1>设置</h1><h2>语义索引</h2><form class="settings" method="post" action="/settings">
	<input type="hidden" name="revision" value="${revision}">
	<label>空闲索引时长（分钟）<input required type="number" min="1" max="35791" name="idle" value="${current.index_idle_minutes ?? 120}"></label>
	<small>最后一次 MCP 工具调用结束后，连续空闲达到此时长时开始索引。默认 120 分钟。</small>
	${current.embedding ? `<label>每日请求上限（次）<input required type="number" min="0" max="100000" name="budget" value="${current.embedding.max_requests_per_day}"></label><small>额度由整个数据库共享，按 UTC 日期重置。</small>` : "<p>当前使用全文检索。启用 embedding 后，空闲索引时长才会生效。</p>"}
	<p>保存后，请重启此记忆库的 MCP 服务以应用设置。</p><button>保存设置</button></form>`,
	};
}
