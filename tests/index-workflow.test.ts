import { ReviewIndex } from "@/retrieval/review-index.js";
import assert from "node:assert/strict";
import { test, vi } from "vite-plus/test";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline";
import { MaterialStore } from "@/storage/materials.js";
import { CompatibleEmbeddingProvider, type EmbeddingProvider } from "@/providers/embedding.js";
import { readIndexStatus } from "@/retrieval/index-status.js";

const scope = { space: "home", character: "reader", world: "real" };
const vpx = resolve("node_modules/vite-plus/bin/vpx");
const script = resolve("scripts/index.ts");
function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
function seed(database: string) {
	const store = new MaterialStore(database);
	for (let i = 0; i < 10; i++)
		store.submit("client", scope, {
			operation_id: `source-${i}`,
			text: `旅行记忆 ${i}`,
			source_kind: "activity_report",
			speaker: "reader",
			coverage: "synthetic activity",
		});
	store.close();
}
function cli(args: string[], entry = script, ipc = false) {
	const child = spawn(process.execPath, [vpx, entry, ...args], {
		windowsHide: true,
		stdio: ipc ? ["ignore", "pipe", "pipe", "ipc"] : ["ignore", "pipe", "pipe"],
	});
	let stdout = "",
		stderr = "";
	child.stdout!.on("data", (chunk) => {
		stdout += chunk;
	});
	child.stderr!.on("data", (chunk) => {
		stderr += chunk;
	});
	const done = once(child, "close").then(([code]) => ({ code, stdout, stderr }));
	return { child, done };
}
async function fixture() {
	const dir = mkdtempSync(join(tmpdir(), "index-workflow-"));
	const requests: string[][] = [];
	let fail = false;
	let beforeResponse = async () => {};
	const server = createServer(async (req, res) => {
		const parts: Buffer[] = [];
		for await (const part of req) parts.push(Buffer.from(part));
		const body = JSON.parse(Buffer.concat(parts).toString());
		requests.push(body.input);
		await beforeResponse();
		if (fail) {
			res.writeHead(503).end();
			return;
		}
		res.setHeader("content-type", "application/json");
		res.end(
			JSON.stringify({
				model: "fixture",
				data: body.input.map((_: string, index: number) => ({ index, embedding: [1, 0] })),
			}),
		);
	});
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const address = server.address();
	assert.ok(address && typeof address !== "string");
	const config = {
		...scope,
		database: join(dir, "memory.db"),
		embedding: {
			endpoint: `http://127.0.0.1:${address.port}/v1/embeddings`,
			model: "fixture",
			dimensions: 2,
			max_requests_per_day: 20,
			timeout_ms: 5000,
		},
	};
	const runtime = join(dir, "runtime.json");
	seed(config.database);
	const save = () => writeFileSync(runtime, JSON.stringify(config));
	save();
	return {
		dir,
		config,
		runtime,
		requests,
		save,
		fail: (value: boolean) => {
			fail = value;
		},
		gate: (callback: () => Promise<void>) => {
			beforeResponse = callback;
		},
		async close() {
			server.closeAllConnections();
			await new Promise<void>((done) => server.close(() => done()));
			rmSync(dir, { recursive: true, force: true });
		},
	};
}

async function viewer(runtime: string, dir: string) {
	const child = spawn(process.execPath, [resolve("dist/src/viewer.js"), runtime, "0"], {
		windowsHide: true,
		env: { ...process.env, HOME: dir, USERPROFILE: dir },
	});
	const closed = once(child, "close");
	try {
		let url = "";
		for await (const line of createInterface({ input: child.stdout })) {
			if (line.startsWith("http://127.0.0.1:")) {
				url = line;
				break;
			}
		}
		assert.ok(url);
		assert.equal((await fetch(new URL("/index-status", url))).status, 403);
		const login = await fetch(url, { redirect: "manual" });
		const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
		await fetch(new URL("/select?current=1", url), {
			method: "POST",
			redirect: "manual",
			headers: { cookie, origin: new URL(url).origin },
		});
		return {
			settings(form?: URLSearchParams, origin = new URL(url).origin) {
				return fetch(
					new URL("/settings", url),
					form
						? {
								method: "POST",
								body: form,
								headers: { cookie, origin },
								redirect: "manual",
							}
						: { headers: { cookie } },
				);
			},
			async status() {
				const response = await fetch(new URL("/index-status", url), {
					headers: { cookie },
				});
				assert.equal(response.status, 200);
				return response.text();
			},
			async close() {
				child.kill();
				await closed;
			},
		};
	} catch (error) {
		child.kill();
		await closed;
		throw error;
	}
}

test("viewer settings persist for the selected library and reject stale, invalid and cross-origin saves", async () => {
	const f = await fixture();
	let browser: Awaited<ReturnType<typeof viewer>> | undefined;
	try {
		browser = await viewer(f.runtime, f.dir);
		const page = await (await browser.settings()).text();
		assert.match(page, /name="idle" value="120"/);
		const revision = /name="revision" value="([^"]+)"/.exec(page)![1]!;
		const form = new URLSearchParams({ revision, idle: "30", budget: "5" });
		assert.equal((await browser.settings(form, "https://example.invalid")).status, 403);
		form.set("budget", "-1");
		assert.equal((await browser.settings(form)).status, 400);
		assert.deepEqual(JSON.parse(readFileSync(f.runtime, "utf8")), f.config);
		form.set("budget", "5");
		assert.equal((await browser.settings(form)).status, 303);
		assert.deepEqual(JSON.parse(readFileSync(f.runtime, "utf8")), {
			...f.config,
			index_idle_minutes: 30,
			embedding: { ...f.config.embedding, max_requests_per_day: 5 },
		});
		assert.equal((await browser.settings(form)).status, 409);
		assert.match(await (await browser.settings()).text(), /name="idle" value="30"/);
		assert.match(await browser.status(), /今日请求：0 \/ 5/);
		const { embedding: _model, ...lexical } = f.config;
		writeFileSync(f.runtime, JSON.stringify(lexical));
		const simple = await (await browser.settings()).text();
		assert.ok(!simple.includes('name="budget"'));
		assert.equal(
			(
				await browser.settings(
					new URLSearchParams({
						revision: /name="revision" value="([^"]+)"/.exec(simple)![1]!,
						idle: "15",
					}),
				)
			).status,
			303,
		);
		assert.deepEqual(JSON.parse(readFileSync(f.runtime, "utf8")), {
			...lexical,
			index_idle_minutes: 15,
		});
	} finally {
		await browser?.close();
		await f.close();
	}
});
test("index CLI stops on budget and network failure, then resumes persisted batches to completion", async () => {
	const f = await fixture();
	let browser: Awaited<ReturnType<typeof viewer>> | undefined;
	try {
		f.config.embedding.max_requests_per_day = 1;
		f.save();
		const limited = await cli([f.runtime]).done;
		assert.equal(limited.code, 1, limited.stderr);
		assert.match(limited.stdout, /8\/10（80%）/, JSON.stringify(limited));
		assert.match(limited.stderr, /今日请求额度已用完/);
		assert.equal(readIndexStatus(f.config).indexing?.reason, "EMBEDDING_BUDGET");
		browser = await viewer(f.runtime, f.dir);
		const page = await browser.status();
		assert.match(page, /语义索引覆盖率：80%/);
		assert.match(page, /今日请求额度已用完/);
		assert.equal(f.requests.length, 1);

		f.config.embedding.max_requests_per_day = 20;
		f.save();
		f.fail(true);
		const failed = await cli([f.runtime]).done;
		assert.equal(failed.code, 1);
		assert.match(failed.stderr, /EMBEDDING_UNAVAILABLE/);
		const status = readIndexStatus(f.config);
		assert.equal(status.embedded_chunks, 8);
		assert.equal(status.usage.requests, 2);
		assert.equal(status.indexing?.reason, "EMBEDDING_UNAVAILABLE");
		const failedPage = await browser.status();
		assert.match(failedPage, /embedding 服务请求失败或超时/);
		assert.match(failedPage, /UTC 今日请求：2 \/ 20/);
		assert.equal(f.requests.length, 2, "A failed batch must not retry automatically");

		f.fail(false);
		const resumed = await cli([f.runtime]).done;
		assert.equal(resumed.code, 0, resumed.stderr);
		assert.match(resumed.stdout, /索引完成：10\/10，本次新增 2/);
		assert.equal(f.requests[2]!.length, 2);
		assert.ok(f.requests[2]!.every((text) => !f.requests[0]!.includes(text)));
		assert.equal(readIndexStatus(f.config).indexing?.state, "completed");
		assert.match(await browser.status(), /语义索引覆盖率：100%/);
		const noop = await cli([f.runtime]).done;
		assert.equal(noop.code, 0);
		assert.match(noop.stdout, /本次新增 0/);
		assert.equal(f.requests.length, 3);
		const writer = new MaterialStore(f.config.database);
		try {
			writer.submit("client", scope, {
				operation_id: "new-arrival",
				text: "新增旅行记忆",
				source_kind: "activity_report",
				speaker: "reader",
				coverage: "synthetic activity",
			});
		} finally {
			writer.close();
		}
		assert.match(await browser.status(), /待处理 1 个/);
		f.config.embedding.model = "another-model";
		f.save();
		const newProfile = await browser.status();
		assert.match(newProfile, /当前模型：another-model/);
		assert.match(newProfile, /已索引 0 \/ 11/);
		assert.equal(f.requests.length, 3, "Refreshing new coverage must not auto-index");
		assert.equal((await cli([f.runtime, "--unknown"]).done).code, 1);
		const missing = join(f.dir, "missing.db");
		writeFileSync(f.runtime, JSON.stringify({ ...f.config, database: missing }));
		assert.match(await browser.status(), /重新选择记忆库/);
		assert.equal((await cli([f.runtime]).done).code, 1);
		assert.equal(existsSync(missing), false);
	} finally {
		await browser?.close();
		await f.close();
	}
}, 20_000);

test("Ctrl+C saves the in-flight batch, blocks concurrent MCP indexing and resumes after restart", async () => {
	const f = await fixture();
	const entered = deferred();
	const release = deferred();
	f.gate(async () => {
		entered.resolve();
		await release.promise;
	});
	// Windows cannot deliver POSIX signals to a child; emit the same Node event.
	const bootstrap = join(f.dir, "cancel.mts");
	writeFileSync(
		bootstrap,
		`process.on("message", () => process.emit("SIGINT"));\nawait import(${JSON.stringify(pathToFileURL(script).href)});\nprocess.disconnect();`,
	);
	const run = cli([f.runtime], bootstrap, true);
	const store = new MaterialStore(
		f.config.database,
		undefined,
		new CompatibleEmbeddingProvider(f.config.embedding),
	);
	try {
		await Promise.race([
			entered.promise,
			run.done.then((result) => {
				throw new Error(JSON.stringify(result));
			}),
		]);
		await assert.rejects(store.index(scope, {}), { message: "EMBEDDING_BUSY" });
		assert.equal(store.retrievalStatus(scope).usage.requests, 1);
		const cancelled = new Promise<void>((done) => {
			run.child.stderr!.on("data", (chunk) => {
				if (String(chunk).includes("正在停止")) done();
			});
		});
		run.child.send!("cancel");
		await cancelled;
		release.resolve();
		const result = await run.done;
		assert.equal(result.code, 130, result.stderr);
		assert.match(result.stderr, /已取消/);
		assert.equal(f.requests.length, 1);
		assert.equal(store.retrievalStatus(scope).embedded_chunks, 8);
		assert.equal(store.retrievalStatus(scope).indexing?.state, "cancelled");
		const resumed = await cli([f.runtime]).done;
		assert.equal(resumed.code, 0, resumed.stderr);
		assert.match(resumed.stdout, /本次新增 2/);
	} finally {
		release.resolve();
		if (run.child.connected) run.child.disconnect();
		await run.done;
		store.close();
		await f.close();
	}
}, 20_000);

test("an expired indexing lease can be resumed and its old response cannot overwrite the new job", async () => {
	const dir = mkdtempSync(join(tmpdir(), "index-lease-"));
	const database = join(dir, "memory.db");
	seed(database);
	const response = deferred();
	const entered = deferred();
	const config = {
		endpoint: "https://example.invalid/v1/embeddings",
		model: "fixture",
		dimensions: 2,
		max_requests_per_day: 20,
		timeout_ms: 1000,
	};
	const provider: EmbeddingProvider = {
		config,
		async embed(input) {
			return { vectors: input.map(() => [1, 0]), tokens: null };
		},
	};
	const old = new MaterialStore(database, undefined, {
		config,
		async embed(input) {
			entered.resolve();
			await response.promise;
			return provider.embed(input);
		},
	});
	const next = new MaterialStore(database, undefined, provider);
	vi.useFakeTimers();
	const running = old.indexAll(scope);
	try {
		await entered.promise;
		// Simulate a process suspended beyond the lease, without delivering its heartbeat.
		vi.setSystemTime(Date.now() + 31_000);
		assert.equal(next.retrievalStatus(scope).indexing?.state, "interrupted");
		assert.equal((await next.indexAll(scope)).pending_chunks, 0);
		const rejected = assert.rejects(running, { message: "EMBEDDING_BUSY" });
		response.resolve();
		await rejected;
		assert.equal(next.retrievalStatus(scope).indexing?.state, "completed");
		assert.equal(next.retrievalStatus(scope).embedded_chunks, 10);
	} finally {
		response.resolve();
		await running.catch(() => {});
		vi.useRealTimers();
		old.close();
		next.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test.each([undefined, 1])(
	"idle indexing waits for the configured minutes after all calls finish (%s)",
	async (minutes) => {
		const dir = mkdtempSync(join(tmpdir(), "idle-index-"));
		const database = join(dir, "library.db");
		seed(database);
		const store = new MaterialStore(database, undefined, {
			config: {
				endpoint: "https://example.invalid/v1/embeddings",
				model: "fixture",
				dimensions: 2,
				max_requests_per_day: 10,
				timeout_ms: 1000,
			},
			async embed(input) {
				return { vectors: input.map(() => [1, 0]), tokens: null };
			},
		});
		vi.useFakeTimers();
		const index = new ReviewIndex(store, scope, true, minutes);
		const delay = (minutes ?? 120) * 60_000;
		try {
			await vi.advanceTimersByTimeAsync(delay - 1);
			index.begin();
			index.begin();
			index.end();
			await vi.advanceTimersByTimeAsync(delay);
			assert.equal(store.retrievalStatus(scope).embedded_chunks, 0);
			index.end();
			await vi.advanceTimersByTimeAsync(delay - 1);
			assert.equal(store.retrievalStatus(scope).embedded_chunks, 0);
			await vi.advanceTimersByTimeAsync(1);
			assert.equal(store.retrievalStatus(scope).embedded_chunks, 10);
		} finally {
			await index.close();
			vi.useRealTimers();
			store.close();
			rmSync(dir, { recursive: true, force: true });
		}
	},
);
