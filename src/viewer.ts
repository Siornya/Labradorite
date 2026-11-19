import { h, type Component, type VNode } from "vue";
import { renderToString } from "vue/server-renderer";
import ViewerLayout from "./views/ViewerLayout.vue";
import LibraryEntry from "./views/LibraryEntry.vue";
import DirectoryPicker from "./views/DirectoryPicker.vue";
import IndexStatus from "./views/IndexStatus.vue";
import MemoryList from "./views/MemoryList.vue";
import PeopleList from "./views/PeopleList.vue";
import PersonDetail from "./views/PersonDetail.vue";
import EpisodeDetail from "./views/EpisodeDetail.vue";
import MaterialDetail from "./views/MaterialDetail.vue";
import ReviewList from "./views/ReviewList.vue";
import ReviewDetail from "./views/ReviewDetail.vue";
import SettingList from "./views/SettingList.vue";
import SettingDetail from "./views/SettingDetail.vue";
import { effectiveSettings } from "./storage/settings.js";
import SearchResults from "./views/SearchResults.vue";
import ViewerSettings from "./views/ViewerSettings.vue";
import { libraryMatches, settingsPage } from "./viewer-settings.js";
import { readEpisodeBody } from "./storage/episode-body.js";
import {
	describeEventTime,
	eventRange,
	eventOrder,
	overlaps,
	validTimestamp,
} from "./domain/event-time.js";
import sharp from "sharp";
import { registerViewer } from "./viewer-registry.js";
import { createSearchClient, searchLibrary as searchLocalLibrary } from "./viewer-search.js";
import { findPeople, readPerson } from "./storage/profiles.js";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { createServer, type ServerResponse } from "node:http";
import { createReadStream, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { loadRuntimeConfig } from "./runtime-config.js";
import { defaultDataDirectory } from "./data-directory.js";
import { MaterialError, MaterialStore, type Material } from "./storage/materials.js";
import { indexReason, readIndexStatus } from "./retrieval/index-status.js";

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
const managed = !!process.send;
const standaloneNotice =
	"查看器未通过 MCP 服务启动，支持浏览、人工审阅和全文检索，语义检索不可用。推荐通过已配置 Labradorite 的 MCP 客户端启动记忆服务，使用服务自动打开的查看器；也可在项目目录运行 vpr viewer:url 获取该服务的登录链接。接入步骤见 README。";
if (!managed) console.error(standaloneNotice);
const searchLibrary = managed
	? createSearchClient()
	: (config: Parameters<typeof searchLocalLibrary>[0], query: string) =>
			searchLocalLibrary(config, query, true);
const materialFrom =
	" FROM materials m JOIN spaces s ON s.id=m.space WHERE m.space=? AND m.world=? AND s.character=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id)";
const episodeFrom =
	" FROM episodes e JOIN spaces s ON s.id=e.space WHERE e.space=? AND e.world=? AND s.character=?";
const latest = " AND e.revision=(SELECT MAX(x.revision) FROM episodes x WHERE x.id=e.id)";
type Row = { body: string };
const names = { episodes: "经历", people: "人物档案", album: "相册", materials: "材料" };
type Tab = keyof typeof names;
const links = [
	...Object.entries(names).map(([key, label]) => [key, label, "/?tab=" + key]),
	["traits", "设定", "/traits"],
	["reviews", "回顾记录", "/reviews"],
	["index", "索引状态", "/index-status"],
	["settings", "设置", "/settings"],
];
function page(
	tab: Tab | "index" | "settings" | "traits" | "reviews" | null,
	component: Component,
	props: object,
) {
	return h(
		ViewerLayout,
		{ tab, managed, links, standaloneNotice },
		{ default: () => h(component, props) },
	);
}
async function sendPage(res: ServerResponse, view: VNode, status = 200) {
	const html = await renderToString(view);
	res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
	res.end("<!doctype html>" + html);
}
function openLibrary(path: string) {
	const config = loadRuntimeConfig(path);
	const db = new DatabaseSync(config.database, { readOnly: true });
	const version = db.prepare("PRAGMA user_version").get()?.user_version;
	try {
		if (version !== 4) throw new Error("Unsupported schema");
		db.prepare("SELECT m.body" + materialFrom + " LIMIT 1");
		db.prepare("SELECT e.body" + episodeFrom + " LIMIT 1");
	} catch (error) {
		db.close();
		throw error;
	}
	const scope = [config.space, config.world, config.character];
	function indexStatus() {
		let current: typeof config;
		try {
			current = loadRuntimeConfig(path);
		} catch {
			return page("index", IndexStatus, {
				error: "无法读取运行配置，请检查 runtime.json 后",
				href: "/index-status",
				label: "刷新状态",
			});
		}
		if (!libraryMatches(current, config)) {
			return page("index", IndexStatus, {
				error: "运行配置指向的记忆库或作用域已更改，请",
				href: "/choose",
				label: "重新选择记忆库",
			});
		}
		const status = readIndexStatus(current);
		const percent = status.chunks
			? Math.floor((status.embedded_chunks / status.chunks) * 100)
			: 100;
		const states = {
			running: "正在建立索引",
			completed: "已完成",
			paused: "本次分批调用已结束",
			stopped: "已停止",
			cancelled: "已取消",
			interrupted: "意外中断",
		};
		const job = status.indexing;
		return page("index", IndexStatus, {
			status,
			percent,
			model: current.embedding?.model,
			disabled: indexReason("EMBEDDING_DISABLED"),
			state: job ? states[job.state] : "尚未运行",
			reason: job?.reason && indexReason(job.reason),
			command: `vp run index "${resolve(path)}"`,
		});
	}
	// Filter and sort before LIMIT so browsing does not load every episode body into memory.
	db.function("episode_time_order", { deterministic: true }, (body, basis) => {
		const episode = readEpisodeBody(String(body));
		return basis === "happen" ? eventOrder(episode.happen) : Date.parse(episode.review);
	});
	db.function(
		"episode_time_matches",
		{ deterministic: true },
		(body, basis, from, to, unknown) => {
			const episode = readEpisodeBody(String(body));
			const range = eventRange(episode.happen);
			if (unknown && range) return 0;
			return Number(
				basis === "happen"
					? overlaps(range, String(from) || undefined, String(to) || undefined)
					: (!from || Date.parse(episode.review) >= Date.parse(String(from))) &&
							(!to || Date.parse(episode.review) <= Date.parse(String(to))),
			);
		},
	);
	function material(id: string): Material | undefined {
		const row = db.prepare("SELECT m.body" + materialFrom + " AND m.id=?").get(...scope, id) as
			| Row
			| undefined;
		return row && JSON.parse(row.body);
	}
	function listing(url: URL, tab: Tab) {
		const q = (url.searchParams.get("q") ?? "").slice(0, 512);
		if (tab === "people") {
			const people = findPeople(db, config, q, url.searchParams.get("after") ?? "");
			return page(tab, PeopleList, { q, people: people.items, next: people.next });
		}
		const pageNumber = Math.min(
			Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0),
			1000000,
		);
		const episodes = tab === "episodes";
		const basis = url.searchParams.get("time_basis") ?? "happen";
		const from = url.searchParams.get("from") || undefined;
		const to = url.searchParams.get("to") || undefined;
		const unknown = url.searchParams.get("unknown") === "1";
		if (
			episodes &&
			(!["happen", "review"].includes(basis) ||
				(from && !validTimestamp(from)) ||
				(to && !validTimestamp(to)) ||
				(from && to && Date.parse(from) > Date.parse(to)))
		)
			return page(tab, MemoryList, { tab, invalid: true, heading: names[tab] });

		const query = episodes
			? "SELECT e.body" +
				episodeFrom +
				latest +
				" AND (instr(json_extract(e.body,'$.title'),?) OR instr(json_extract(e.body,'$.summary'),?)) AND episode_time_matches(e.body,?,?,?,?) ORDER BY episode_time_order(e.body,?) DESC,e.rowid DESC"
			: "SELECT m.body" +
				materialFrom +
				(tab === "album" ? " AND json_type(m.body,'$.media')='object'" : "") +
				" AND instr(json_extract(m.body,'$.text'),?) ORDER BY m.rowid DESC";
		// SQLite instr(text,'') is 1, so empty queries include every visible row.
		const rows = db
			.prepare(query + " LIMIT 31 OFFSET ?")
			.all(
				...scope,
				q,
				...(episodes ? [q, basis, from ?? "", to ?? "", unknown ? 1 : 0, basis] : []),
				pageNumber * 30,
			) as Row[];
		const visible = rows.slice(0, 30);
		const link = (n: number) => {
			const params = new URLSearchParams({ tab, q, page: String(n) });
			if (episodes)
				for (const [k, v] of Object.entries({
					time_basis: basis,
					from: from ?? "",
					to: to ?? "",
					unknown: unknown ? "1" : "0",
				}))
					params.set(k, v);
			return "/?" + params;
		};
		return page(tab, MemoryList, {
			tab,
			heading: names[tab],
			q,
			episodes: episodes ? visible.map((row) => readEpisodeBody(row.body)) : undefined,
			materials: episodes
				? undefined
				: visible.map((row) => JSON.parse(row.body) as Material),
			basis,
			from,
			to,
			unknown,
			prev: pageNumber ? link(pageNumber - 1) : undefined,
			next: rows.length > 30 ? link(pageNumber + 1) : undefined,
		});
	}
	function detail(id: string, episode: boolean, rev: string | null) {
		if (episode) {
			const rows = db
				.prepare("SELECT e.body" + episodeFrom + " AND e.id=? ORDER BY e.revision DESC")
				.all(...scope, id) as Row[];
			const history = rows.map((row) => readEpisodeBody(row.body));
			const e = rev ? history.find((x) => String(x.revision) === rev) : history[0];
			if (!e) return;
			return page("episodes", EpisodeDetail, {
				episode: e,
				time: describeEventTime(e.happen),
				parts: [
					["经过", e.beats.map((x) => x.text)],
					["当时的理解", e.interpretations.map((x) => x.text)],
					["尚不清楚", e.unknowns],
				],
				sources: e.source_ids.map(material).filter(Boolean),
				history,
			});
		}
		const m = material(id);
		if (!m) return;
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
		return page(m.media ? "album" : "materials", MaterialDetail, {
			material: m,
			related,
			corrections,
		});
	}
	function personDetail(id: string) {
		const person = readPerson(db, config, id);
		if (person) return page("people", PersonDetail, { person });
	}
	async function search(query: string, lexical: boolean) {
		const result = await searchLibrary(config, query, lexical);
		const rows = result.items as {
			kind: "episode" | "material";
			id: string;
			excerpt?: string;
			stale: boolean;
		}[];
		const people = findPeople(db, config, query).items;
		const items = rows.map((item) => ({
			...item,
			label:
				item.kind === "episode" ? "经历" : material(item.id)?.media ? "相册材料" : "材料",
		}));
		const semantic = result.diagnostics.semantic;
		return page("episodes", SearchResults, {
			query,
			people,
			items,
			semantic,
			reason:
				semantic.reason &&
				semantic.reason !== "SYNC_LEXICAL_ONLY" &&
				indexReason(semantic.reason),
		});
	}
	return {
		selection: randomBytes(16).toString("hex"),
		configPath: resolve(path),
		settings: (form?: URLSearchParams) => settingsPage(path, config, form),
		indexStatus,
		search,
		listing,
		detail,
		personDetail,
		material,
		config,
		close: () => {
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
function entry(directory: string, useStartupConfig: boolean) {
	const query = useStartupConfig ? "current=1" : "dir=" + encodeURIComponent(directory);
	return page(null, LibraryEntry, { query, directory });
}
function picker(requested: string, error = "") {
	let folder;
	try {
		const path = localDirectory(requested);
		const entries = readdirSync(path, { withFileTypes: true });
		const links = entries
			.filter((e) => e.isDirectory())
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((e) => ({ path: join(path, e.name), label: e.name + "/" }));
		if (dirname(path) !== path) links.unshift({ path: dirname(path), label: "↑ 上一级" });
		folder = {
			path,
			links,
			usable: entries.some((e) => e.name === "runtime.json" && e.isFile()),
		};
	} catch {
		error ||= "无法读取目录，请输入本机可访问的绝对路径。";
	}
	return page(null, DirectoryPicker, { requested, error, folder });
}
type Session = { library?: ReturnType<typeof openLibrary> };
const stylesheet = readFileSync(new URL("./viewer.css", import.meta.url));
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
		"default-src 'none'; style-src 'self'; img-src 'self'; media-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
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
			const session = sessions.get(id)!;
			let landing = "/choose";
			if (url.searchParams.get("library") === "current") {
				try {
					const library = openLibrary(resolve(runtime));
					session.library?.close();
					session.library = library;
					landing = "/";
				} catch {
					landing = "/choose?open_error=1";
				}
			}

			res.writeHead(303, {
				"set-cookie": cookie + "=" + id + "; Path=/; HttpOnly; SameSite=Strict",
				location: landing,
			});
			res.end();
			return;
		}
		const session = token ? sessions.get(token) : undefined;
		if (!session) return fail(403);
		if (req.method === "GET" && url.pathname === "/viewer.css") {
			res.writeHead(200, { "content-type": "text/css; charset=utf-8" });
			res.end(stylesheet);
			return;
		}
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
				await sendPage(
					res,
					picker(
						dir || startingFolder,
						"无法打开记忆库，请检查配置、数据库版本和读取权限。",
					),
					400,
				);
				return;
			}
			res.writeHead(303, { location: "/" });
			res.end();
			return;
		}
		const reviewRoute = /^\/reviews\/([a-f0-9]{64})$/.exec(url.pathname);
		const traitRoute = /^\/traits(?:\/([a-f0-9-]{36}))?$/.exec(url.pathname);
		if (
			(url.pathname === "/settings" ||
				((reviewRoute || traitRoute) && req.method === "POST")) &&
			(req.method === "GET" || req.method === "POST")
		) {
			const selected = session.library;
			if (!selected) return fail(404);
			let form: URLSearchParams | undefined;
			if (req.method === "POST") {
				if (req.headers.origin !== "http://" + req.headers.host) return fail(403);
				if (
					req.headers["content-type"]?.split(";")[0] !==
					"application/x-www-form-urlencoded"
				)
					return fail(415);
				const chunks: Buffer[] = [];
				let length = 0;
				for await (const chunk of req) {
					length += chunk.length;
					if (length > (traitRoute ? 65536 : 1024)) return fail(413);
					chunks.push(chunk);
				}
				if (session.library !== selected || sessions.get(token!) !== session)
					return fail(409);
				form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
			}
			if ((reviewRoute || traitRoute) && form) {
				if (
					form.get("selection") !== selected.selection ||
					!libraryMatches(loadRuntimeConfig(selected.configPath), selected.config)
				)
					return fail(409);
				const action = form.get("action");
				const store = new MaterialStore(
					selected.config.database,
					undefined,
					undefined,
					"audit",
				);
				try {
					if (traitRoute) {
						const version = traitRoute[1];
						if (version) {
							store.settings.act(
								selected.config,
								version,
								action ?? "",
								form.get("mode"),
							);
						} else {
							if (action !== "save") return fail(400);
							const { space, character, world } = selected.config;
							store.saveOwnerSetting(
								{ space, character, world },
								form.get("operation") ?? "",
								{
									target: form.get("target"),
									title: form.get("title"),
									body: form.get("body"),
									...(form.has("id")
										? {
												id: form.get("id"),
												expected_version: form.get("version"),
											}
										: {}),
								},
								form.get("mode"),
							);
						}
						res.writeHead(303, { location: url.pathname });
						res.end();
						return;
					}
					if (!reviewRoute || (action !== "check" && action !== "undo")) return fail(400);
					const code = store.reviews.act(selected.config, reviewRoute[1]!, action);
					if (code === 303) {
						res.writeHead(303, { location: url.pathname });
						res.end();
					} else if (code === 409) {
						const detail = store.reviews.detail(selected.config, reviewRoute[1]!);
						await sendPage(
							res,
							page("reviews", ReviewDetail, {
								detail,
								selection: selected.selection,
								conflict: true,
							}),
							409,
						);
					} else return fail(code);
				} finally {
					store.close();
				}
				return;
			}
			const { status, ...settings } = selected.settings(form);
			if (status === 303) {
				res.writeHead(303, { location: "/settings?saved=1" });
				res.end();
			} else {
				await sendPage(
					res,
					page("settings", ViewerSettings, {
						...settings,
						saved: url.searchParams.get("saved") === "1",
					}),
					status,
				);
			}
			return;
		}
		if (req.method !== "GET") return fail(405);
		if (url.pathname === "/choose" || (url.pathname === "/" && !session.library)) {
			const directory =
				url.searchParams.get("dir") ??
				dirname(session.library?.configPath ?? resolve(runtime));
			await sendPage(
				res,
				url.searchParams.has("open_error")
					? picker(directory, "无法打开当前记忆库，请检查配置或选择其他目录。")
					: url.searchParams.has("browse")
						? picker(directory)
						: entry(
								localDirectory(directory),
								!url.searchParams.has("dir") &&
									(!session.library ||
										session.library.configPath === resolve(runtime)),
							),
			);
			return;
		}
		if (!session.library) return fail(404);
		const { search, material, listing, detail, config } = session.library;
		let html: VNode | undefined;
		if (traitRoute) {
			const store = new MaterialStore(config.database, undefined, undefined, "inspect");
			try {
				const props = {
					selection: session.library.selection,
					operation: randomBytes(16).toString("hex"),
				};
				if (traitRoute[1]) {
					html = page("traits", SettingDetail, {
						...props,
						...store.settings.detail(config, traitRoute[1]),
						world: config.world,
					});
				} else {
					const rows = store.settings.history(config);
					html = page("traits", SettingList, {
						...props,
						active: effectiveSettings(rows),
						pending: rows.filter((r) => r.state === "proposed"),
					});
				}
			} finally {
				store.close();
			}
		} else if (url.pathname === "/reviews" || reviewRoute) {
			const store = new MaterialStore(config.database, undefined, undefined, "inspect");
			try {
				if (reviewRoute) {
					const detail = store.reviews.detail(config, reviewRoute[1]!);
					if (!detail) return fail(404);
					html = page("reviews", ReviewDetail, {
						detail,
						selection: session.library.selection,
					});
				} else {
					const number = Math.min(
						1000000,
						Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0),
					);
					html = page("reviews", ReviewList, {
						...store.reviews.list(config, number),
						pageNumber: number,
					});
				}
			} finally {
				store.close();
			}
		} else if (url.pathname === "/search") {
			const q = url.searchParams.get("q")?.trim();
			if (!q || Array.from(q).length > 512) return fail(400);
			const selected = session.library;
			html = await search(q, url.searchParams.get("mode") === "lexical");
			if (session.library !== selected) return fail(409);
		} else if (url.pathname === "/index-status") {
			html = session.library.indexStatus();
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
		await sendPage(res, html);
	} catch (error) {
		if (error instanceof MaterialError) {
			const status =
				error.code === "NOT_FOUND" ? 404 : error.code === "VALIDATION_ERROR" ? 400 : 409;
			res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
			res.end(
				status === 409
					? "设定已更新，请返回设定页核对当前版本。"
					: status === 404
						? "找不到该记录。"
						: "请检查设定内容和修改方式。",
			);
			return;
		}
		fail((error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500);
	}
});
function shutdown(code: number) {
	for (const session of sessions.values()) session.library?.close();
	sessions.clear();
	process.exit(code);
}
process.once("SIGINT", () => shutdown(130));
process.once("SIGTERM", () => shutdown(143));
// A managed viewer also exits if its MCP parent terminates unexpectedly.
if (process.send) process.once("disconnect", () => shutdown(0));
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
