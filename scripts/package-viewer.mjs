import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const windows = process.platform === "win32";
const staging = mkdtempSync(join(tmpdir(), "labradorite-release-"));
const name = "labradorite-viewer-" + process.platform + "-" + process.arch;
const folder = join(staging, name);
try {
	mkdirSync(folder);
	const entries = readdirSync("dist/portable-build").filter((x) => /^viewer\.m?js$/.test(x));
	if (entries.length !== 1) throw new Error("Expected a bundled viewer entry");
	copyFileSync(join("dist/portable-build", entries[0]), join(folder, "viewer.mjs"));
	copyFileSync(process.execPath, join(folder, windows ? "node.exe" : "node"));
	const license = [
		process.env.NODE_LICENSE_FILE,
		join(dirname(process.execPath), "LICENSE"),
		join(dirname(process.execPath), "..", "LICENSE"),
	].find((x) => x && existsSync(x));
	if (!license)
		throw new Error("Set NODE_LICENSE_FILE to the license from the bundled Node distribution.");
	copyFileSync(license, join(folder, "NODE-LICENSE.txt"));
	writeFileSync(join(folder, "README.md"), readFileSync("README.md"));
	if (windows)
		writeFileSync(
			join(folder, "Labradorite Viewer.cmd"),
			'@echo off\r\n"%~dp0node.exe" "%~dp0viewer.mjs" %* --open\r\nif errorlevel 1 pause\r\n',
		);
	else
		writeFileSync(
			join(folder, "labradorite-viewer"),
			'#!/bin/sh\nbase=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec "$base/node" "$base/viewer.mjs" "$@"\n',
			{ mode: 0o755 },
		);
	const archive = resolve("dist", name + (windows ? ".zip" : ".tar.gz"));
	execFileSync(
		"tar",
		[...(windows ? ["-a", "-cf"] : ["-czf"]), archive, "-C", staging, basename(folder)],
		{ stdio: "inherit" },
	);
	console.log(archive);
} finally {
	rmSync(staging, { recursive: true, force: true });
}
