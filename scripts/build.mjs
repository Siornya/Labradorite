import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, basename } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../dist", import.meta.url));
if (dirname(output) !== root.replace(/[\\/]$/, "") || basename(output) !== "dist")
	throw new Error("Invalid build output directory.");
rmSync(output, { recursive: true, force: true });
const result = spawnSync(
	process.execPath,
	[fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url))],
	{ cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
