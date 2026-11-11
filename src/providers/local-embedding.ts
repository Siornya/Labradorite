import { spawn, type ChildProcess } from "node:child_process";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { RuntimeConfig } from "@/runtime-config.js";
import {
	CompatibleEmbeddingProvider,
	EmbeddingError,
	type EmbeddingConfig,
	type EmbeddingProvider,
} from "./embedding.js";
import { enginePath, fileDigest, release } from "./llama-install.js";

export class LocalEmbeddingProvider extends CompatibleEmbeddingProvider {
	readonly spaceKey = "llama.cpp:" + release + ":whole-chunk";
	private child?: ChildProcess;
	private starting: Promise<void> | undefined;
	private closed = false;
	constructor(
		config: EmbeddingConfig,
		private readonly local: NonNullable<RuntimeConfig["local_model"]>,
	) {
		super(config);
	}
	private async ready() {
		const res = await fetch(new URL("/v1/models", this.config.endpoint), {
			redirect: "error",
			signal: AbortSignal.timeout(1500),
		}).catch(() => undefined);
		if (!res) return false;
		if (res.status === 503) {
			await res.body?.cancel();
			return false;
		}
		const models = await res.json();
		if (!res.ok || !models?.data?.some((m: { id: string }) => m.id === this.config.model))
			throw new Error("内置引擎端口已被其他服务占用。");
		return true;
	}
	private async launch() {
		if (await this.ready()) return;
		const executable = await enginePath();
		if ((await fileDigest(this.local.file)) !== this.local.sha256)
			throw new Error("模型文件已改变，请重新执行 setup 选择模型。");
		if (this.closed) throw new Error("内置引擎已关闭。");
		const child = spawn(
			executable,
			[
				"-m",
				this.local.file,
				"--embedding",
				"--alias",
				this.config.model,
				"--host",
				"127.0.0.1",
				"--port",
				new URL(this.config.endpoint).port,
				"--parallel",
				"1",
				"--ubatch-size",
				"2048",
				"--batch-size",
				"2048",
				"--offline",
				"--no-webui",
			],
			{
				cwd: dirname(executable),
				windowsHide: true,
				stdio: ["ignore", "ignore", "pipe"],
				env: Object.fromEntries(
					Object.entries(process.env).filter(
						([name]) => !name.toUpperCase().startsWith("LLAMA_ARG_"),
					),
				),
			},
		);
		this.child = child;
		const stopChild = () => child.kill();
		process.once("exit", stopChild);
		child.once("close", () => process.removeListener("exit", stopChild));
		let reason = "";
		child.stderr?.on("data", (data) => {
			reason = (reason + data.toString()).slice(-1200);
		});
		child.once("error", (error) => {
			reason = error.message;
		});
		const deadline = Date.now() + 120_000;
		try {
			do {
				if (this.closed) throw new Error("内置引擎已关闭。");
				if (await this.ready()) return;
				// Another client may be loading the same model on the configured port.
				if (
					(!child.pid || child.exitCode !== null || child.signalCode) &&
					!/bind|address already in use/i.test(reason)
				)
					throw new Error("llama-server 启动失败。 " + reason);
				await delay(200);
			} while (Date.now() < deadline);
			throw new Error("等待 llama-server 就绪超时。 " + reason);
		} catch (error) {
			child.kill();
			throw error;
		}
	}
	ensureReady() {
		return (this.starting ??= this.launch().finally(() => {
			this.starting = undefined;
		}));
	}
	protected override async requestVectors(input: string[], dimensions: number | undefined) {
		try {
			await this.ensureReady();
		} catch (error) {
			console.error(error instanceof Error ? error.message : "内置引擎不可用。");
			throw new EmbeddingError("EMBEDDING_UNAVAILABLE");
		}
		return super.requestVectors(input, dimensions);
	}
	close() {
		this.closed = true;
		this.child?.kill();
	}
}
export function runtimeProvider(config: RuntimeConfig): EmbeddingProvider | undefined {
	if (!config.embedding) return undefined;
	return config.local_model
		? new LocalEmbeddingProvider(config.embedding, config.local_model)
		: new CompatibleEmbeddingProvider(config.embedding);
}
