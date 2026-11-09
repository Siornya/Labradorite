import { createHash, randomUUID } from "node:crypto";
import { createReadStream, linkSync, unlinkSync } from "node:fs";
import { copyFile, mkdir, open, realpath, stat, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { MaterialError, type MaterialStore, type MemoryScope } from "./materials.js";

export interface MediaAsset {
	file: string;
	kind: "photo" | "video";
	original_name: string;
	bytes: number;
	observed_range_ms?: [number, number];
}

export async function checksum(path: string) {
	const hash = createHash("sha256");
	for await (const part of createReadStream(path)) hash.update(part);
	return hash.digest("hex");
}

async function format(path: string) {
	const handle = await open(path, "r");
	try {
		const bytes = Buffer.alloc(16);
		const { bytesRead } = await handle.read(bytes);
		if (bytesRead >= 8 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a")
			return "png";
		if (bytes.subarray(0, 3).toString("hex") === "ffd8ff") return "jpg";
		if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
			return "webp";
		if (
			bytes.toString("ascii", 4, 8) === "ftyp" &&
			/^(isom|iso2|mp4[12]|avc1|M4V )$/.test(bytes.toString("ascii", 8, 12))
		)
			return "mp4";
		throw new MaterialError("VALIDATION_ERROR");
	} finally {
		await handle.close();
	}
}

export async function importMedia(
	database: string,
	filename: string,
	material: unknown,
	store: MaterialStore,
	scope: MemoryScope,
	principal: string,
	observedRange?: unknown,
) {
	if (
		!filename ||
		filename.length > 255 ||
		filename !== basename(filename) ||
		/[\\/:]/.test(filename) ||
		Array.from(filename).some((c) => c.charCodeAt(0) < 32) ||
		filename === "." ||
		filename === ".."
	)
		throw new MaterialError("VALIDATION_ERROR");
	const inbox = await realpath(database + ".inbox");
	const source = await realpath(join(inbox, filename));
	if (dirname(source) !== inbox || !(await stat(source)).isFile())
		throw new MaterialError("VALIDATION_ERROR");
	const directory = database + ".media";
	await mkdir(directory, { recursive: true });
	const staged = join(directory, randomUUID() + ".tmp");
	try {
		await copyFile(source, staged);
		const extension = await format(staged);
		if (
			observedRange !== undefined &&
			(extension !== "mp4" ||
				!Array.isArray(observedRange) ||
				observedRange.length !== 2 ||
				!observedRange.every((n) => Number.isSafeInteger(n) && n >= 0) ||
				observedRange[0] >= observedRange[1])
		)
			throw new MaterialError("VALIDATION_ERROR");
		const file = (await checksum(staged)) + "." + extension;
		const asset: MediaAsset = {
			file,
			kind: extension === "mp4" ? "video" : "photo",
			original_name: filename,
			...(observedRange ? { observed_range_ms: observedRange as [number, number] } : {}),
			bytes: (await stat(staged)).size,
		};
		let created = false;
		try {
			linkSync(staged, join(directory, file));
			created = true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
		}
		try {
			return store.submit(principal, scope, material, asset);
		} catch (error) {
			if (created) unlinkSync(join(directory, file));
			throw error;
		}
	} finally {
		await unlink(staged).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== "ENOENT") throw error;
		});
	}
}
