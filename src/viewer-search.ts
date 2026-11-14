import type { ChildProcess } from "node:child_process";
import type { RuntimeConfig } from "./runtime-config.js";
import type { EmbeddingProvider } from "./providers/embedding.js";
import { MaterialStore } from "./storage/materials.js";

export async function searchLibrary(
	config: RuntimeConfig,
	query: string,
	lexical: boolean,
	provider?: EmbeddingProvider,
) {
	const store = new MaterialStore(
		config.database,
		undefined,
		lexical ? undefined : provider,
		"search",
	);
	try {
		return await store.recallAsync(config, {
			query,
			limit: 20,
			max_bytes: 65536,
			mode: lexical ? "lexical" : "hybrid",
		});
	} finally {
		store.close();
	}
}

type SearchResult = Awaited<ReturnType<typeof searchLibrary>>;
interface SearchRequest {
	type: "search";
	id: number;
	config: RuntimeConfig;
	query: string;
	lexical: boolean;
}
interface SearchResponse {
	type: "search-result";
	id: number;
	result?: SearchResult;
	error?: string;
}

export function serveViewerSearch(
	viewer: ChildProcess,
	getProvider: (config: RuntimeConfig) => EmbeddingProvider | undefined,
) {
	viewer.on("message", async (message: SearchRequest) => {
		if (message.type !== "search") return;
		const response: SearchResponse = { type: "search-result", id: message.id };
		try {
			response.result = await searchLibrary(
				message.config,
				message.query,
				message.lexical,
				message.lexical ? undefined : getProvider(message.config),
			);
		} catch {
			response.error = "记忆库搜索失败。";
		}
		if (viewer.connected) viewer.send?.(response, undefined, {}, () => {});
	});
}

export function createSearchClient() {
	let nextId = 0;
	const pending = new Map<
		number,
		{ resolve: (result: SearchResult) => void; reject: (error: Error) => void }
	>();
	process.on("message", (message: SearchResponse) => {
		if (message.type !== "search-result") return;
		const request = pending.get(message.id);
		if (!request) return;
		pending.delete(message.id);
		if (message.result) request.resolve(message.result);
		else request.reject(new Error(message.error));
	});
	process.once("disconnect", () => {
		for (const request of pending.values()) request.reject(new Error("MCP 主进程已断开。"));
		pending.clear();
	});
	return (config: RuntimeConfig, query: string, lexical: boolean) =>
		new Promise<SearchResult>((resolve, reject) => {
			if (!process.connected || !process.send) {
				reject(new Error("MCP 主进程未连接。"));
				return;
			}
			const id = ++nextId;
			pending.set(id, { resolve, reject });
			process.send(
				{ type: "search", id, config, query, lexical } satisfies SearchRequest,
				undefined,
				{},
				(error: Error | null) => {
					if (!error) return;
					pending.delete(id);
					reject(error);
				},
			);
		});
}
