import { runtimeProvider } from "@/providers/local-embedding.js";
import type { RuntimeConfig } from "@/runtime-config.js";
import { MaterialStore } from "@/storage/materials.js";

export function indexReason(reason: string): string {
	const messages: Record<string, string> = {
		EMBEDDING_DISABLED: "未配置语义检索，请先运行 vp run setup 配置 embedding。",
		EMBEDDING_BUDGET:
			"今日请求额度已用完；额度按 UTC 日期重置，也可调整配置中的每日上限后再运行。",
		EMBEDDING_BUSY: "已有索引任务正在运行。若它已意外退出，请在 30 秒后重试。",
		EMBEDDING_CONFIG: "embedding 配置或密钥环境变量不可用，请检查后再运行。",
		EMBEDDING_UNAVAILABLE: "embedding 服务请求失败或超时，请检查服务与网络后再运行。",
		EMBEDDING_RESPONSE: "embedding 返回的模型、维度或向量格式不符合配置，请检查服务后再运行。",
		EMBEDDING_INPUT: "有片段不符合 embedding 输入要求，请检查材料后再运行。",
		INDEX_CANCELLED: "已取消，已完成的批次已保存；再次运行同一命令即可继续。",
		INDEX_INTERRUPTED: "上次任务意外中断，已完成的批次仍保留；可再次运行索引命令。",
		INDEX_FAILED: "索引未能完成，请检查数据库和运行日志后再运行。",
		INDEX_PENDING: "部分内容尚未建立语义索引。",
	};
	return messages[reason] ?? "语义检索暂不可用，请检查配置和服务状态。";
}

// Creating a provider only identifies the vector space; no embedding request or
// local engine startup occurs. The database connection is always read-only.
export function readIndexStatus(config: RuntimeConfig) {
	const provider = runtimeProvider(config);
	let store: MaterialStore | undefined;
	try {
		store = new MaterialStore(config.database, undefined, provider, "inspect");
		return store.retrievalStatus(config);
	} finally {
		store?.close();
		provider?.close?.();
	}
}
