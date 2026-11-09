import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const directory = join(homedir(), ".labradorite", "viewers");

export function registerViewer(url: string, runtime: string) {
	mkdirSync(directory, { recursive: true, mode: 0o700 });
	const temp = join(directory, randomUUID() + ".tmp");
	const record = join(directory, process.pid + "-" + randomUUID() + ".json");
	try {
		writeFileSync(temp, JSON.stringify({ url, runtime }), { mode: 0o600, flag: "wx" });
		renameSync(temp, record);
	} finally {
		rmSync(temp, { force: true });
	}
	process.once("exit", () => rmSync(record, { force: true }));
}

export async function activeViewers() {
	let files: string[];
	try {
		files = readdirSync(directory);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
	const viewers: { url: string; runtime: string }[] = [];
	for (const file of files.filter((f) => f.endsWith(".json"))) {
		try {
			const info = JSON.parse(readFileSync(join(directory, file), "utf8"));
			if (
				typeof info.runtime !== "string" ||
				typeof info.url !== "string" ||
				!/^http:\/\/127\.0\.0\.1:\d+\/open\/[a-f0-9]{48}$/.test(info.url)
			)
				continue;
			const response = await fetch(info.url.replace("/open/", "/status/"), {
				signal: AbortSignal.timeout(1500),
				redirect: "manual",
			});
			if (response.status === 204) viewers.push({ url: info.url, runtime: info.runtime });
			await response.body?.cancel();
		} catch {
			continue;
		}
	}
	return viewers;
}
