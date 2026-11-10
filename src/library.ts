import Database from "better-sqlite3";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { loadRuntimeConfig } from "./runtime-config.js";
import { checksum } from "./storage/media.js";
import { findPeople, readPerson } from "./storage/profiles.js";
import type { Material, Episode } from "./storage/materials.js";

const [command, input, target] = process.argv.slice(2);
if (
	!input ||
	!target ||
	!["backup", "restore", "markdown"].includes(command ?? "") ||
	process.argv.length !== 5
)
	throw new Error(
		"Usage: library <backup|markdown> runtime.json NEW_DIRECTORY | library restore BACKUP NEW_DIRECTORY",
	);
const destination = resolve(target);
async function copyAsset(file: string, from: string, to: string) {
	if (!/^[a-f0-9]{64}\.(jpg|png|webp|mp4)$/.test(file))
		throw new Error("Invalid asset reference");
	const output = join(to, file);
	await copyFile(join(from, file), output);
	if ((await checksum(output)) !== file.slice(0, 64)) throw new Error("Media checksum mismatch");
}
function quote(text: string) {
	return text
		.split(/\r?\n/)
		.map((line) => "> " + line)
		.join("\n");
}
async function run() {
	if (command === "restore") {
		const manifest = JSON.parse(await readFile(join(input!, "manifest.json"), "utf8"));
		if (
			manifest.format !== 1 ||
			![manifest.space, manifest.character, manifest.world].every(
				(v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(v),
			)
		)
			throw new Error("Invalid backup manifest");
		const database = join(destination, "memory.db");
		await copyFile(join(input!, "memory.db"), database);
		if ((await checksum(database)) !== manifest.sha256)
			throw new Error("Database checksum mismatch");
		const db = new Database(database, { readonly: true });
		try {
			if (db.pragma("integrity_check", { simple: true }) !== "ok")
				throw new Error("Invalid database");
			await mkdir(database + ".media");
			for (const row of db
				.prepare(
					"SELECT DISTINCT json_extract(body,'$.media.file') AS file FROM materials WHERE json_type(body,'$.media')='object'",
				)
				.all() as { file: string }[])
				await copyAsset(row.file, join(input!, "media"), database + ".media");
		} finally {
			db.close();
		}
		await mkdir(database + ".inbox");
		await writeFile(
			join(destination, "runtime.json"),
			JSON.stringify(
				{
					database,
					space: manifest.space,
					character: manifest.character,
					world: manifest.world,
				},
				null,
				"\t",
			),
		);
		return;
	}
	const config = loadRuntimeConfig(input!);
	const source = new Database(config.database, { readonly: true, fileMustExist: true });
	const scratch = await mkdtemp(join(tmpdir(), "memory-export-"));
	try {
		const snapshot = join(command === "backup" ? destination : scratch, "memory.db");
		await source.backup(snapshot);
		const db = new Database(snapshot, { readonly: true });
		try {
			const version = db.pragma("user_version", { simple: true });
			if (version !== 3 && version !== 4)
				throw new Error("Expected a v3 or v4 memory database");
			const assets = join(destination, "media");
			await mkdir(assets);
			if (command === "backup") {
				for (const row of db
					.prepare(
						"SELECT DISTINCT json_extract(body,'$.media.file') AS file FROM materials WHERE json_type(body,'$.media')='object'",
					)
					.all() as { file: string }[])
					await copyAsset(row.file, config.database + ".media", assets);
				await writeFile(
					join(destination, "manifest.json"),
					JSON.stringify(
						{
							format: 1,
							space: config.space,
							character: config.character,
							world: config.world,
							sha256: await checksum(snapshot),
						},
						null,
						"\t",
					),
				);
				return;
			}
			const params = [config.space, config.world, config.character];
			const rows = db
				.prepare(
					"SELECT body FROM materials m JOIN spaces s ON m.space=s.id WHERE m.space=? AND m.world=? AND s.character=? AND NOT EXISTS(SELECT 1 FROM tombstones t WHERE t.id=m.id) ORDER BY m.rowid",
				)
				.iterate(...params) as Iterable<{ body: string }>;
			const copied = new Set<string>();
			const album = ["# 相册"];
			for (const row of rows) {
				const m = JSON.parse(row.body) as Material;
				const lines = [
					"# 原始材料",
					m.received_at,
					quote(m.text),
					"记录来源 " + quote(m.speaker),
					"处理范围 " + quote(m.coverage),
				];
				if (m.corrects) lines.push("[更正的材料](" + m.corrects + ".md)");
				if (m.media) {
					const file = m.media.file;
					if (!copied.has(file)) {
						await copyAsset(file, config.database + ".media", assets);
						copied.add(file);
					}
					const link =
						(m.media.kind === "photo" ? "!" : "") + "[原文件](media/" + file + ")";
					lines.push(link);
					album.push(link + " · [材料记录](" + m.id + ".md)");
				}
				await writeFile(join(destination, m.id + ".md"), lines.join("\n\n") + "\n");
			}
			await writeFile(join(destination, "Album.md"), album.join("\n\n") + "\n");
			if (version === 4) {
				let after: string | null = "";
				do {
					const page = findPeople(db, config, "", after);
					for (const item of page.items) {
						const person = readPerson(db, config, item.id)!;
						const lines = ["# " + person.name, quote(person.identity)];
						for (const review of person.history) {
							const label =
								review.impression === null
									? "关联经历"
									: review.revision === person.current_impression?.revision
										? "当前印象"
										: "以往印象";
							lines.push("## " + label + " · " + review.formed_at);
							if (review.impression) lines.push(quote(review.impression));
							for (const ref of review.episodes)
								lines.push(
									`[依据的经历（版本 ${ref.revision}）](${ref.id}-v${ref.revision}.md)`,
								);
						}
						await writeFile(
							join(destination, "person-" + person.id + ".md"),
							lines.join("\n\n") + "\n",
						);
					}
					after = page.next;
				} while (after !== null);
			}
			for (const row of db
				.prepare(
					"SELECT body FROM episodes e JOIN spaces s ON e.space=s.id WHERE e.space=? AND e.world=? AND s.character=? ORDER BY e.id,e.revision",
				)
				.iterate(...params) as Iterable<{ body: string }>) {
				const e = JSON.parse(row.body) as Episode;
				const lines = [
					"# " + e.title,
					"模型整理 · 修订 " + e.revision,
					quote(e.summary),
					...e.beats.map((x) => quote(x.text)),
					...e.interpretations.map((x) => "解释 " + quote(x.text)),
					...e.unknowns.map((x) => "未知 " + quote(x)),
					...e.source_ids.map((id) => "[来源 " + id + "](" + id + ".md)"),
				];
				await writeFile(
					join(destination, e.id + "-v" + e.revision + ".md"),
					lines.join("\n\n") + "\n",
				);
			}
		} finally {
			db.close();
		}
	} finally {
		source.close();
		await rm(scratch, { recursive: true, force: true });
	}
}
await mkdir(destination);
try {
	await run();
} catch (error) {
	await rm(destination, { recursive: true, force: true });
	throw error;
}
