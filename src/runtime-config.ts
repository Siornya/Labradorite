import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

export interface RuntimeConfig {
	database: string;
	space: string;
	character: string;
	world: string;
}

export function loadRuntimeConfig(path: string): RuntimeConfig {
	const value: unknown = JSON.parse(readFileSync(path, "utf8"));
	if (!value || typeof value !== "object") throw new Error("Invalid runtime configuration.");
	const config = value as Record<string, unknown>;
	for (const key of ["database", "space", "character", "world"]) {
		if (typeof config[key] !== "string") throw new Error("Invalid runtime configuration.");
	}
	if (
		Object.keys(config).some(
			(key) => !["database", "space", "character", "world"].includes(key),
		)
	)
		throw new Error(
			"Unknown runtime configuration field. Regenerate the configuration for stdio MCP.",
		);
	if (!isAbsolute(config.database as string)) throw new Error("Database path must be absolute.");
	for (const key of ["space", "character", "world"]) {
		if (!/^[A-Za-z0-9_-]{1,128}$/.test(config[key] as string))
			throw new Error("Invalid scope.");
	}
	return config as unknown as RuntimeConfig;
}
