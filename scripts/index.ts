import { MaterialStore } from "@/storage/materials.js";
import { loadRuntimeConfig } from "@/runtime-config.js";
import { runtimeProvider } from "@/providers/local-embedding.js";
import { EmbeddingError, type EmbeddingProvider } from "@/providers/embedding.js";
import { indexReason } from "@/retrieval/index-status.js";

const usage =
	"用法：vp run index /path/to/runtime.json\n逐批建立语义索引直至完成。Ctrl+C 在当前批次结束后停止，再次运行可继续。";
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
	console.log(usage);
} else if (args.length !== 1 || args[0]!.startsWith("--")) {
	console.error(usage);
	process.exitCode = 1;
} else {
	let store: MaterialStore | undefined;
	let provider: EmbeddingProvider | undefined;
	const controller = new AbortController();
	const cancel = () => {
		if (!controller.signal.aborted)
			console.error("正在停止：等待当前批次结束并保存进度，请勿强制关闭进程。");
		controller.abort();
	};
	process.on("SIGINT", cancel);
	process.on("SIGTERM", cancel);
	try {
		const config = loadRuntimeConfig(args[0]!);
		provider = runtimeProvider(config);
		if (!provider) throw new EmbeddingError("EMBEDDING_DISABLED");
		// Require an existing library; a typo must not create an empty database.
		store = new MaterialStore(config.database, undefined, provider, "search");
		console.log("开始建立语义索引。Ctrl+C 可在当前批次结束后停止。");
		const result = await store.indexAll(config, {
			signal: controller.signal,
			onProgress: (status) => {
				const percent = status.chunks
					? Math.floor((status.embedded_chunks / status.chunks) * 100)
					: 100;
				console.log(
					`索引进度：${status.embedded_chunks}/${status.chunks}（${percent}%），待处理 ${status.pending_chunks}；UTC 今日请求 ${status.usage.requests}/${status.max_requests_per_day}`,
				);
			},
		});
		if (result.stopped) {
			console.error(`${indexReason(result.stopped)} [${result.stopped}]`);
			process.exitCode = result.stopped === "INDEX_CANCELLED" ? 130 : 1;
		} else {
			console.log(
				`索引完成：${result.embedded_chunks}/${result.chunks}，本次新增 ${result.indexed_chunks} 个片段。`,
			);
		}
	} catch (error) {
		const reason = error instanceof EmbeddingError ? error.code : "INDEX_FAILED";
		console.error(`${indexReason(reason)} [${reason}]`);
		if (!(error instanceof EmbeddingError))
			console.error("请确认 runtime.json、已有记忆库路径及作用域有效。已完成的批次会保留。");
		process.exitCode = 1;
	} finally {
		process.removeListener("SIGINT", cancel);
		process.removeListener("SIGTERM", cancel);
		store?.close();
		provider?.close?.();
	}
}
