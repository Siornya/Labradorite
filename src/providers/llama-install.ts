import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

export const release = "b12247";
const archives: Record<string, [string, string]> = {
	"win32-x64": [
		"win-cpu-x64.zip",
		"5d3a384d959c0c5f5848bdabc3e395b62b524d350ccede00b349dda1bbdb82bc",
	],
	"win32-arm64": [
		"win-cpu-arm64.zip",
		"46278f9c1fc243caea3a866b0bc018f55c1ed56896b68fca73b1bd9b6fac0009",
	],
	"linux-x64": [
		"ubuntu-x64.tar.gz",
		"b353ef1ba235d377d4370d5e5e891f2b934db6fba81a21fd6a58f50a686e719b",
	],
	"linux-arm64": [
		"ubuntu-arm64.tar.gz",
		"04800cb388b517d53920871f9ec8ec448ebf98ccf2d0e3985d1234c95e6f63e0",
	],
	"darwin-x64": [
		"macos-x64.tar.gz",
		"0fd38423ee9e475cfa073dafc8dbe22686ddae6fed765f90b1c1b6eb4a412fa9",
	],
	"darwin-arm64": [
		"macos-arm64.tar.gz",
		"b64dc877683899be407bfe2d1776047ee137b7f1aaf1d90a25f29225f89e5f28",
	],
};
// stdio MCP clients can omit the shell's LOCALAPPDATA and XDG_CACHE_HOME.
const cache = join(homedir(), ".labradorite", "embedding");
const engine = join(cache, release + "-" + process.platform + "-" + process.arch);
const modelFile = "Qwen3-Embedding-0.6B-Q8_0.gguf";
const recommendedDigest = "06507c7b42688469c4e7298b0a1e16deff06caf291cf0a5b278c308249c3e439";

export async function fileDigest(path: string) {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest("hex");
}
async function download(url: string, dest: string, digest: string) {
	console.error("正在下载 " + basename(new URL(url).pathname));
	const controller = new AbortController();
	const idle = setTimeout(() => controller.abort(new Error("下载超时。")), 120_000);
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok || !response.body) throw new Error("下载失败 HTTP " + response.status);
		const hash = createHash("sha256");
		const body = response.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, output) {
					idle.refresh();
					hash.update(chunk);
					output.enqueue(chunk);
				},
			}),
		);
		await pipeline(body, createWriteStream(dest, { flags: "wx", mode: 0o600 }));
		if (hash.digest("hex") !== digest) throw new Error("下载文件 SHA-256 校验失败。");
	} finally {
		clearTimeout(idle);
	}
}
// Publish only complete directories. A concurrent setup may have won the rename.
async function installDirectory(dest: string, prepare: (dir: string) => Promise<void>) {
	if (existsSync(dest)) return;
	await mkdir(cache, { recursive: true, mode: 0o700 });
	const temp = await mkdtemp(join(cache, "install-"));
	try {
		await prepare(temp);
		try {
			await rename(temp, dest);
		} catch (error) {
			if (!existsSync(dest)) throw error;
		}
	} finally {
		await rm(temp, { recursive: true, force: true });
	}
}
export async function enginePath(root = engine) {
	const name = process.platform === "win32" ? "llama-server.exe" : "llama-server";
	const files = await readdir(root, { recursive: true });
	const path = files.find((file) => basename(file) === name);
	if (!path) throw new Error("安装包缺少 " + name);
	return join(root, path);
}
export async function installEngine() {
	const archive = archives[process.platform + "-" + process.arch];
	if (!archive) throw new Error("此平台暂无内置运行包，请连接已有 embedding 服务。");
	await installDirectory(engine, async (temp) => {
		const name = "llama-" + release + "-bin-" + archive[0];
		const path = join(temp, name);
		await download(
			"https://github.com/ggml-org/llama.cpp/releases/download/" + release + "/" + name,
			path,
			archive[1],
		);
		await promisify(execFile)("tar", ["-xf", path, "-C", temp], { windowsHide: true });
		await enginePath(temp);
		await rm(path);
	});
}
export async function prepareLocalModel(path?: string) {
	if (path) {
		const file = resolve(path);
		return { file, sha256: await fileDigest(file) };
	}
	const dir = join(cache, recommendedDigest);
	await installDirectory(dir, (temp) =>
		download(
			"https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/370f27d7550e0def9b39c1f16d3fbaa13aa67728/" +
				modelFile,
			join(temp, modelFile),
			recommendedDigest,
		),
	);
	const file = join(dir, modelFile);
	if ((await fileDigest(file)) !== recommendedDigest) throw new Error("缓存模型校验失败。");
	return { file, sha256: recommendedDigest };
}
