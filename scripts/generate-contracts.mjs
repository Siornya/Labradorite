import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";

const check = process.argv.includes("--check");
const schemasDirectory = new URL("../src/contracts/schemas/", import.meta.url);
const outputDirectory = new URL("../src/contracts/generated/", import.meta.url);
const names = (await readdir(schemasDirectory)).filter((name) => name.endsWith(".json")).sort();
const expectedOutputs = new Set(names.map((name) => name.replace(/\.json$/, ".ts")));
const stale = [];

await mkdir(outputDirectory, { recursive: true });

for (const name of names) {
	const schema = JSON.parse(await readFile(new URL(name, schemasDirectory), "utf8"));
	const output = await compile(schema, schema.title, {
		cwd: fileURLToPath(schemasDirectory),
		bannerComment:
			"/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */",
		style: { useTabs: true, tabWidth: 4, printWidth: 100 },
		additionalProperties: false,
	});
	const targetName = name.replace(/\.json$/, ".ts");
	const target = new URL(targetName, outputDirectory);
	if (!check) {
		await writeFile(target, output);
		continue;
	}
	let existing;
	try {
		existing = await readFile(target, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	if (existing !== output) stale.push(targetName);
}

for (const name of await readdir(outputDirectory)) {
	if (name.endsWith(".ts") && !expectedOutputs.has(name)) stale.push(name);
}

if (stale.length > 0) {
	console.error(`Generated contracts are stale: ${stale.join(", ")}.`);
	console.error("Run vp run contracts:generate and remove obsolete generated files.");
	process.exitCode = 1;
} else {
	console.info(`${check ? "Checked" : "Generated"} ${names.length} contract types.`);
}
