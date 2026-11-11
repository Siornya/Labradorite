import sharp from "sharp";
import { registerViewer } from "./viewer-registry.js";
import { MaterialStore } from "./storage/materials.js";
import { findPeople, readPerson } from "./storage/profiles.js";
import { runtimeProvider } from "./providers/local-embedding.js";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { loadRuntimeConfig } from "./runtime-config.js";
import { defaultDataDirectory } from "./data-directory.js";
import type { Material, Episode } from "./storage/materials.js";

const args = process.argv.slice(2);
if (args.includes("--help")) {
	console.log(
		"Labradorite Viewer [runtime.json] [port] [--open]\n启动后在网页中选择数据目录。可指定 runtime.json 作为起始位置。默认端口 4317。",
	);
	process.exit(0);
}
const positional = args.filter((arg) => arg !== "--open");
const [
	runtime = process.env.LABRADORITE_RUNTIME ?? join(defaultDataDirectory(), "runtime.json"),
	portText = "4317",
] = positional;
if (positional.length > 2 || !/^\d+$/.test(portText) || Number(portText) > 65535)
	throw new Error("Usage: Labradorite Viewer [runtime.json] [port] [--open]");
const materialFrom =
	" FROM materials m JOIN spaces s ON s.id=m.space WHERE m.space=? AND m.world=? AND s.character=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id)";
const episodeFrom =
	" FROM episodes e JOIN spaces s ON s.id=e.space WHERE e.space=? AND e.world=? AND s.character=?";
const latest = " AND e.revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id)";
type Row = { body: string };
const escape = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
	);
const names = { episodes: "经历", people: "人物档案", album: "相册", materials: "材料" };
type Tab = keyof typeof names;
function layout(tab: Tab | null, content: string) {
	const searchForm = tab
		? '<form action="/search"><input type="search" name="q" aria-label="搜索整个记忆库" maxlength="512" placeholder="搜索经历、人物、材料和相册" required><select name="mode" aria-label="检索方式"><option value="hybrid">混合检索</option><option value="lexical">仅本地全文</option></select><button>全库搜索</button></form>'
		: "";
	const tabs = Object.entries(names)
		.map(
			([key, label]) =>
				`<a ${key === tab ? 'aria-current="page"' : ""} href="/?tab=${key}">${label}</a>`,
		)
		.join("");
	return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labradorite · 记忆库</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f5f0;color:#233632;font:16px/1.65 "Source Sans 3","Microsoft YaHei",sans-serif}header{background:#153d39;color:#faf6e9;padding:16px max(5vw,24px);display:flex;align-items:center;gap:32px;flex-wrap:wrap}strong,h1,h2{font-family:"DM Serif Text","Songti SC",serif}header strong{font-size:24px}nav{display:flex;gap:20px}a{color:#20665e}nav a{color:inherit;text-decoration:none}nav a[aria-current]{border-bottom:2px solid #d4b879}main{max-width:1024px;margin:32px auto;padding:0 24px 48px}h1{font-size:32px}h2{font-size:20px}article,section{border-bottom:1px solid #cad3ca;padding:15px 0}small{color:#51635d}.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(225px,100%),1fr))}.grid img{width:100%;height:180px;object-fit:cover}.grid article{min-width:0}img,video{display:block;max-width:100%;max-height:65vh}p,h1,h2,a{overflow-wrap:anywhere}p{white-space:pre-wrap}form{display:flex;gap:8px}form{flex-wrap:wrap}input,button,select{font:inherit;padding:6px 12px;border:1px solid #849b90;border-radius:4px}input{max-width:75%}button{background:#205249;color:white;cursor:pointer}</style><header><strong>Labradorite</strong><nav>${tab ? tabs + ' <a href="/choose">切换记忆库</a>' : ""}</nav></header><main>${searchForm}${content}</main></html>`;
}
function openLibrary(path: string) {
	const config = loadRuntimeConfig(path);
	const db = new DatabaseSync(config.database, { readOnly: true });
	const version = db.prepare("PRAGMA user_version").get()?.user_version;
	try {
		if (version !== 3 && version !== 4) throw new Error("Unsupported schema");
		db.prepare("SELECT m.body" + materialFrom + " LIMIT 1");
		db.prepare("SELECT e.body" + episodeFrom + " LIMIT 1");
	} catch (error) {
		db.close();
		throw error;
	}
	const scope = [config.space, config.world, config.character];
	const embedding = runtimeProvider(config);
	function material(id: string): Material | undefined {
		const row = db.prepare("SELECT m.body" + materialFrom + " AND m.id=?").get(...scope, id) as
			| Row
			| undefined;
		return row && JSON.parse(row.body);
	}
	function listing(url: URL, tab: Tab) {
		const q = (url.searchParams.get("q") ?? "").slice(0, 512);
		if (tab === "people") {
			const page =
				version === 4
					? findPeople(db, config, q, url.searchParams.get("after") ?? "")
					: { items: [], next: null };
			const cards = page.items.map(personCard).join("");
			const next = page.next
				? `<a href="/?tab=people&amp;q=${encodeURIComponent(q)}&amp;after=${encodeURIComponent(page.next)}">下一页</a>`
				: "";
			return layout(
				tab,
				`<h1>人物档案</h1><form><input type="hidden" name="tab" value="people"><input name="q" aria-label="姓名或身份线索" placeholder="姓名或身份线索" value="${escape(q)}"><button>筛选</button></form>${cards || "<p>没有符合条件的人物档案。</p>"}${next}`,
			);
		}
		const page = Math.min(
			Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0),
			1000000,
		);
		const episodes = tab === "episodes";
		const query = episodes
			? "SELECT e.body" +
				episodeFrom +
				latest +
				" AND (instr(json_extract(e.body,'$.title'),?) OR instr(json_extract(e.body,'$.summary'),?)) ORDER BY e.rowid DESC"
			: "SELECT m.body" +
				materialFrom +
				(tab === "album" ? " AND json_type(m.body,'$.media')='object'" : "") +
				" AND instr(json_extract(m.body,'$.text'),?) ORDER BY m.rowid DESC";
		// SQLite instr(text,'') is 1, so empty queries include every visible row.
		const rows = db
			.prepare(query + " LIMIT 31 OFFSET ?")
			.all(...scope, q, ...(episodes ? [q] : []), page * 30) as Row[];
		const cards = rows
			.slice(0, 30)
			.map((row) => {
				if (episodes) {
					const e = JSON.parse(row.body) as Episode;
					return `<article><small>${escape(e.recorded_at)} · 修订 ${e.revision}</small><h2><a href="/episode/${encodeURIComponent(e.id)}">${escape(e.title)}</a></h2><p>${escape(e.summary.slice(0, 180))}</p></article>`;
				}
				const m = JSON.parse(row.body) as Material;
				const path = "/material/" + encodeURIComponent(m.id);
				const photo =
					tab === "album" && m.media?.kind === "photo"
						? `<img loading="lazy" alt="" src="/thumbnail/${encodeURIComponent(m.id)}">`
						: "";
				return `<article><a href="${path}">${photo}${escape(m.text.slice(0, 100))}</a><br><small>${m.media ? escape(m.media.original_name) + " · " : ""}${escape(m.received_at)}</small></article>`;
			})
			.join("");
		const link = (n: number, label: string) =>
			`<a href="/?tab=${tab}&amp;q=${encodeURIComponent(q)}&amp;page=${n}">${label}</a>`;
		return layout(
			tab,
			`<h1>${names[tab]}</h1><form><input type="hidden" name="tab" value="${tab}"><input name="q" aria-label="筛选当前列表" placeholder="筛选当前列表" value="${escape(q)}"><button>筛选</button></form><div class="${tab === "album" ? "grid" : ""}">${cards || "<p>没有符合条件的记录</p>"}</div>${page ? link(page - 1, "上一页") : ""} ${rows.length > 30 ? link(page + 1, "下一页") : ""}`,
		);
	}
	function detail(id: string, episode: boolean, rev: string | null) {
		if (episode) {
			const rows = db
				.prepare("SELECT e.body" + episodeFrom + " AND e.id=? ORDER BY e.revision DESC")
				.all(...scope, id) as Row[];
			const history = rows.map((row) => JSON.parse(row.body) as Episode);
			const e = rev ? history.find((x) => String(x.revision) === rev) : history[0];
			if (!e) return;
			const parts = (label: string, values: string[]) =>
				values.length
					? `<section><h2>${label}</h2>${values.map((x) => "<p>" + escape(x) + "</p>").join("")}</section>`
					: "";
			const sources = e.source_ids
				.map((key) => {
					const m = material(key);
					return m
						? `<li><a href="/material/${encodeURIComponent(key)}">${escape(m.media?.original_name ?? m.text.slice(0, 80))}</a></li>`
						: "";
				})
				.join("");
			return layout(
				"episodes",
				`<h1>${escape(e.title)}</h1><small>模型整理 · ${escape(e.recorded_at)}</small><p>${escape(e.summary)}</p>${parts(
					"经过",
					e.beats.map((x) => x.text),
				)}${parts(
					"当时的理解",
					e.interpretations.map((x) => x.text),
				)}${parts("尚不清楚", e.unknowns)}<h2>原始材料</h2><ul>${sources}</ul><h2>修订历史</h2>${history.map((x) => `<a href="?rev=${x.revision}">版本 ${x.revision}</a>`).join(" · ")}`,
			);
		}
		const m = material(id);
		if (!m) return;
		const src = "/media/" + encodeURIComponent(id);
		const media = m.media
			? m.media.kind === "photo"
				? `<img src="${src}" alt="归档照片">`
				: `<video controls preload="metadata" src="${src}"></video>`
			: "";
		const range = m.media?.observed_range_ms;
		const corrections = db
			.prepare("SELECT m.id" + materialFrom + " AND json_extract(m.body,'$.corrects')=?")
			.all(...scope, id) as { id: string }[];
		const related = db
			.prepare(
				"SELECT e.id,json_extract(e.body,'$.title') AS title" +
					episodeFrom +
					latest +
					" AND EXISTS(SELECT 1 FROM episode_sources r WHERE r.episode=e.id AND r.revision=e.revision AND r.source=?) ORDER BY e.rowid DESC",
			)
			.all(...scope, id) as { id: string; title: string }[];
		const backlinks = related
			.map(
				(e) =>
					`<li><a href="/episode/${encodeURIComponent(e.id)}">${escape(e.title)}</a></li>`,
			)
			.join("");
		return layout(
			m.media ? "album" : "materials",
			`<h1>${escape(m.media?.original_name ?? "原始材料")}</h1><small>${escape(m.speaker)} · ${escape(m.received_at)}</small>${media}<p>${escape(m.text)}</p><h2>记录范围</h2><p>${escape(m.coverage)}</p>${range ? `<p>报告的观看区间：${range[0] / 1000}–${range[1] / 1000} 秒</p>` : ""}<h2>关联经历</h2>${backlinks ? "<ul>" + backlinks + "</ul>" : "<p>暂无经历引用这条材料。</p>"}${m.corrects ? `<a href="/material/${encodeURIComponent(m.corrects)}">查看被更正的原记录</a>` : ""}${corrections.map((x) => `<p><a href="/material/${encodeURIComponent(x.id)}">查看后续更正</a></p>`).join("")}`,
		);
	}
	function personCard(person: { id: string; name: string; identity: string }) {
		return `<article><h2><a href="/person/${encodeURIComponent(person.id)}">${escape(person.name)}</a></h2><p>${escape(person.identity)}</p></article>`;
	}
	function personDetail(id: string) {
		const person = version === 4 ? readPerson(db, config, id) : undefined;
		if (!person) return;
		const history = person.history
			.toReversed()
			.map((review) => {
				const evidence = review.episodes
					.map((ref) => {
						return `<li><a href="/episode/${encodeURIComponent(ref.id)}?rev=${ref.revision}">${escape(ref.title)} · 版本 ${ref.revision}</a></li>`;
					})
					.join("");
				const label =
					review.impression === null
						? "关联经历"
						: review.revision === person.current_impression?.revision
							? "当前印象"
							: "以往印象";
				return `<section><h2>${label}</h2><small>${escape(review.formed_at)}</small>${review.impression ? "<p>" + escape(review.impression) + "</p>" : ""}<ul>${evidence}</ul></section>`;
			})
			.join("");
		return layout(
			"people",
			`<h1>${escape(person.name)}</h1><p>${escape(person.identity)}</p>${history}`,
		);
	}
	async function search(query: string, lexical: boolean) {
		const provider = lexical ? undefined : embedding;
		const store = new MaterialStore(config.database, undefined, provider, "search");
		try {
			const result = await store.recallAsync(config, {
				query,
				limit: 20,
				max_bytes: 65536,
				mode: lexical ? "lexical" : "hybrid",
			});
			const rows = result.items as {
				kind: "episode" | "material";
				id: string;
				excerpt?: string;
				stale: boolean;
			}[];
			const people =
				version === 4 ? findPeople(db, config, query).items.map(personCard).join("") : "";
			const cards =
				people +
				rows
					.map((item) => {
						const m = item.kind === "material" ? material(item.id) : undefined;
						const label =
							item.kind === "episode" ? "经历" : m?.media ? "相册材料" : "材料";
						return `<article><small>${label}${item.stale ? " · 有后续更正" : ""}</small><p><a href="/${item.kind}/${encodeURIComponent(item.id)}">${escape(item.excerpt ?? "展开记录")}</a></p></article>`;
					})
					.join("");
			return layout(
				"episodes",
				`<h1>搜索结果</h1><p>${escape(query)} · ${result.diagnostics.semantic.used ? "混合检索" : "全文检索"}</p>${cards || "<p>没有匹配的记录。</p>"}`,
			);
		} finally {
			store.close();
		}
	}
	return {
		search,
		listing,
		detail,
		personDetail,
		material,
		config,
		close: () => {
			embedding?.close?.();
			db.close();
		},
	};
}

const suggested = dirname(resolve(runtime));
const startingFolder = existsSync(suggested) ? suggested : homedir();
function localDirectory(value: string) {
	if (!isAbsolute(value) || (process.platform === "win32" && !/^[a-z]:[\\/]/i.test(value)))
		throw new Error("Expected local absolute directory");
	return resolve(value);
}
function picker(requested: string, error = "") {
	let listing = "";
	try {
		const path = localDirectory(requested);
		const entries = readdirSync(path, { withFileTypes: true });
		const browse = (dest: string, label: string) =>
			`<a href="/choose?dir=${encodeURIComponent(dest)}">${escape(label)}</a>`;
		if (entries.some((entry) => entry.name === "runtime.json" && entry.isFile()))
			listing += `<form method="post" action="/select?dir=${encodeURIComponent(path)}"><button>打开此记忆库</button></form>`;
		else listing += "<p>此目录没有 runtime.json，请选择记忆库所在的文件夹。</p>";
		listing +=
			"<section>" +
			(dirname(path) !== path ? browse(dirname(path), "↑ 上一级") : "") +
			entries
				.filter((entry) => entry.isDirectory())
				.sort((a, b) => a.name.localeCompare(b.name))
				.map(
					(entry) =>
						"<div>" + browse(join(path, entry.name), entry.name + "/") + "</div>",
				)
				.join("") +
			"</section>";
	} catch {
		error ||= "无法读取目录，请输入本机可访问的绝对路径。";
	}
	return layout(
		null,
		`<h1>打开记忆库</h1><form action="/select?current=1" method="post"><button>打开当前记忆库</button></form><details ${error || requested !== startingFolder ? "open" : ""}><summary>选择其他目录</summary><p>选择运行查看器的机器上包含 runtime.json 的文件夹。</p><form action="/choose"><input style="flex:1" name="dir" aria-label="目录路径" value="${escape(requested)}"><button>浏览</button></form>${error ? "<p role=alert>" + escape(error) + "</p>" : ""}${listing}</details>`,
	);
}
type Session = { library?: ReturnType<typeof openLibrary> };
const sessions = new Map<string, Session>();
const secret = randomBytes(24).toString("hex");
const cookie = "viewer_" + secret.slice(0, 8);
const thumbs = new Map<string, Buffer>();
const server = createServer(async (req, res) => {
	const fail = (code: number) => {
		res.writeHead(code);
		res.end();
	};
	res.setHeader("Cache-Control", "no-store");
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader(
		"Content-Security-Policy",
		"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; media-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
	);
	try {
		if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(req.headers.host ?? "")) return fail(403);

		const url = new URL(req.url ?? "/", "http://localhost");
		if (req.method === "GET" && url.pathname === "/status/" + secret) {
			res.writeHead(204);
			res.end();
			return;
		}
		const token = req.headers.cookie
			?.split(/;\s*/)
			.find((v) => v.startsWith(cookie + "="))
			?.slice(cookie.length + 1);
		if (req.method === "GET" && url.pathname === "/open/" + secret) {
			let id = token;
			if (!id || !sessions.has(id)) {
				if (sessions.size >= 32) {
					const oldest = sessions.keys().next().value!;
					sessions.get(oldest)?.library?.close();
					sessions.delete(oldest);
				}
				id = randomBytes(24).toString("hex");
				sessions.set(id, {});
			}
			res.writeHead(303, {
				"set-cookie": cookie + "=" + id + "; Path=/; HttpOnly; SameSite=Strict",
				location: "/choose",
			});
			res.end();
			return;
		}
		const session = token ? sessions.get(token) : undefined;
		if (!session) return fail(403);
		if (req.method === "POST" && url.pathname === "/select") {
			if (req.headers.origin !== "http://" + req.headers.host) return fail(403);
			const dir = url.searchParams.get("dir") ?? "";
			try {
				const path =
					url.searchParams.get("current") === "1"
						? resolve(runtime)
						: join(localDirectory(dir), "runtime.json");
				const library = openLibrary(path);
				session.library?.close();
				session.library = library;
			} catch {
				res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
				res.end(picker(dir, "无法打开记忆库，请检查配置、数据库版本和读取权限。"));
				return;
			}
			res.writeHead(303, { location: "/" });
			res.end();
			return;
		}
		if (req.method !== "GET") return fail(405);
		if (url.pathname === "/choose" || (url.pathname === "/" && !session.library)) {
			res.setHeader("Content-Type", "text/html; charset=utf-8");
			res.end(picker(url.searchParams.get("dir") ?? startingFolder));
			return;
		}
		if (!session.library) return fail(404);
		const { search, material, listing, detail, config } = session.library;
		let html: string | undefined;
		if (url.pathname === "/search") {
			const q = url.searchParams.get("q")?.trim();
			if (!q || Array.from(q).length > 512) return fail(400);
			const selected = session.library;
			html = await search(q, url.searchParams.get("mode") === "lexical");
			if (session.library !== selected) return fail(409);
		} else if (url.pathname === "/") {
			const tab = url.searchParams.get("tab") ?? "episodes";
			if (!Object.hasOwn(names, tab)) return fail(404);
			html = listing(url, tab as Tab);
		} else {
			const match = /^\/(thumbnail|media|material|episode|person)\/([a-zA-Z0-9_-]+)$/.exec(
				url.pathname,
			);
			if (!match) return fail(404);
			const id = match[2]!;
			if (match[1] === "media" || match[1] === "thumbnail") {
				const asset = material(id)?.media;
				if (!asset || !/^[a-f0-9]{64}\.(jpg|png|webp|mp4)$/.test(asset.file))
					return fail(404);
				const path = join(config.database + ".media", asset.file);
				if (match[1] === "thumbnail") {
					if (asset.kind !== "photo") return fail(404);
					const selected = session.library;
					const thumbnail =
						thumbs.get(path) ??
						(await sharp(path)
							.rotate()
							.resize({
								width: 480,
								height: 320,
								fit: "inside",
								withoutEnlargement: true,
							})
							.webp({ quality: 75 })
							.toBuffer());
					if (session.library !== selected || material(id)?.media?.file !== asset.file)
						return fail(404);
					if (thumbs.size >= 64) thumbs.delete(thumbs.keys().next().value!);
					thumbs.set(path, thumbnail);
					res.setHeader("Content-Type", "image/webp");
					res.end(thumbnail);
					return;
				}
				const size = statSync(path).size;
				let start = 0,
					end = size - 1;
				if (req.headers.range) {
					const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
					if (!range || (!range[1] && !range[2])) return fail(416);
					if (range[1]) {
						start = Number(range[1]);
						if (range[2]) end = Math.min(end, Number(range[2]));
					} else start = Math.max(0, size - Number(range[2]));
					if (start > end || start >= size) return fail(416);
					res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
					res.statusCode = 206;
				}
				res.setHeader(
					"Content-Type",
					asset.kind === "video"
						? "video/mp4"
						: "image/" +
								(asset.file.endsWith(".jpg")
									? "jpeg"
									: asset.file.split(".").pop()),
				);
				res.setHeader("Accept-Ranges", "bytes");
				res.setHeader("Content-Length", end - start + 1);
				const stream = createReadStream(path, { start, end });
				stream.on("error", () => res.destroy());
				res.on("close", () => stream.destroy());
				stream.pipe(res);
				return;
			}
			html =
				match[1] === "person"
					? session.library.personDetail(id)
					: detail(id, match[1] === "episode", url.searchParams.get("rev"));
		}
		if (!html) return fail(404);
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end(html);
	} catch (error) {
		fail((error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500);
	}
});
// A managed viewer also exits if its MCP parent terminates unexpectedly.
if (process.send) process.once("disconnect", () => process.exit(0));
function listen(port: number) {
	server.once("error", (error: NodeJS.ErrnoException) => {
		if (process.send && error.code === "EADDRINUSE" && port !== 0) {
			listen(0);
			return;
		}
		console.error("无法启动查看器：" + error.message);
		process.exit(1);
	});
	server.listen(port, "127.0.0.1");
}
server.once("listening", () => {
	const address = server.address();
	if (!address || typeof address !== "object") return;
	const url = `http://127.0.0.1:${address.port}/open/${secret}`;
	try {
		registerViewer(url, resolve(runtime));
	} catch {
		console.error("无法保存查看器地址，请保留下方登录链接。");
	}
	console.log(url);
	if (args.includes("--open")) {
		const command =
			process.platform === "win32"
				? "rundll32.exe"
				: process.platform === "darwin"
					? "open"
					: "xdg-open";
		const browser = spawn(
			command,
			process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url],
			{ stdio: "ignore", windowsHide: true },
		);
		browser.on("error", () => console.error("请在浏览器中打开上方链接。"));
		browser.unref();
	}
});

listen(Number(portText));
