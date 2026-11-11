import { once } from "node:events";
import { createServer, type AddressInfo } from "node:net";
import select from "@inquirer/select";
import input from "@inquirer/input";
import type { RuntimeConfig } from "@/runtime-config.js";
import { CompatibleEmbeddingProvider } from "@/providers/embedding.js";
import { LocalEmbeddingProvider } from "@/providers/local-embedding.js";
import { installEngine, prepareLocalModel } from "@/providers/llama-install.js";

async function localEndpoint() {
	await using server = createServer().listen(0, "127.0.0.1");
	await once(server, "listening");
	const { port } = server.address() as AddressInfo;
	return `http://127.0.0.1:${port}/v1/embeddings`;
}
type Options = {
	embedding?: string | undefined;
	model?: string | undefined;
	endpoint?: string | undefined;
	"api-key-env"?: string | undefined;
};
async function answer(question: Promise<string>) {
	try {
		return (await question).trim();
	} catch (error) {
		if (error instanceof Error && error.name === "ExitPromptError") {
			console.info("已取消配置。");
			process.exit(0);
		}
		throw error;
	}
}
async function selectEmbedding(ask: (message: string) => Promise<string>): Promise<Options> {
	const mode = await answer(
		select({
			message: "选择检索方式",
			choices: [
				{
					value: "local",
					name: "内置 Qwen",
					description: "首次下载约 639 MB 模型和 12–25 MB 引擎",
				},
				{
					value: "manual",
					name: "手动配置 embedding",
					description: "已有服务或自己的 GGUF 文件",
				},
				{ value: "lexical", name: "仅全文检索", description: "本地关键词检索" },
			],
		}),
	);
	if (mode !== "manual") return { embedding: mode };
	const source = await answer(
		select({
			message: "选择模型来源",
			choices: [
				{
					value: "external",
					name: "使用已有服务",
					description: "Ollama、llama.cpp 或其他兼容接口",
				},
				{ value: "file", name: "使用自己的 GGUF 文件" },
			],
		}),
	);
	if (source === "external") return { embedding: source };
	return { embedding: "local", model: await ask("GGUF 文件路径") };
}
export async function configureEmbedding(runtime: RuntimeConfig, args: Options) {
	const interactive = process.stdin.isTTY && process.stdout.isTTY;
	if (!args.embedding && (args.model || args.endpoint || args["api-key-env"]))
		throw new Error("请同时指定 --embedding 模式。");
	if (!args.embedding && (runtime.embedding || !interactive)) return;
	const ask = async (message: string, required = true) =>
		interactive
			? answer(
					input({
						message,
						validate: (value) => (required && !value?.trim() ? "请输入内容。" : true),
					}),
				)
			: "";
	const { embedding: mode, model: selectedModel } = args.embedding
		? args
		: await selectEmbedding(ask);
	if (
		(args.endpoint && mode !== "external") ||
		(args["api-key-env"] && mode !== "external") ||
		(args.model && mode === "lexical")
	)
		throw new Error("此模式不接受所给参数。");
	if (mode === "lexical") {
		delete runtime.embedding;
		delete runtime.local_model;
		return;
	}
	const defaults = {
		max_requests_per_day: runtime.embedding?.max_requests_per_day ?? 100,
		timeout_ms: runtime.embedding?.timeout_ms ?? 30000,
		...(runtime.embedding?.min_similarity === undefined
			? {}
			: { min_similarity: runtime.embedding.min_similarity }),
	};
	if (mode === "local") {
		const local = await prepareLocalModel(selectedModel);
		await installEngine();
		const endpoint =
			runtime.local_model?.sha256 === local.sha256 && runtime.embedding
				? runtime.embedding.endpoint
				: await localEndpoint();
		const config = { ...defaults, endpoint, model: "gguf-" + local.sha256 };
		const server = new LocalEmbeddingProvider({ ...config, dimensions: 1 }, local);
		try {
			await server.ensureReady();
			runtime.embedding = await CompatibleEmbeddingProvider.probe(config);
			runtime.local_model = local;
		} finally {
			server.close();
		}
	} else if (mode === "external") {
		const endpoint = args.endpoint ?? (await ask("完整 embedding 接口地址"));
		const model = selectedModel ?? (await ask("embedding 模型名"));
		if (!model || !endpoint) throw new Error("请提供模型名和完整 endpoint。");
		const keyEnv =
			args["api-key-env"] ??
			(!args.embedding ? await ask("API 密钥环境变量名称（无需密钥时回车）", false) : "");
		runtime.embedding = await CompatibleEmbeddingProvider.probe({
			...defaults,
			endpoint,
			model,
			...(keyEnv ? { api_key_env: keyEnv } : {}),
		});
		delete runtime.local_model;
	} else throw new Error("未知的 embedding 模式。");
	console.info(
		"Embedding 已验证，向量维度 " +
			runtime.embedding.dimensions +
			"。加载 MCP 后调用 memory_index 建立索引。",
	);
}
