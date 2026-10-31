import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { requireToken } from "./transport/daemon.js";

export interface RuntimeConfig {
	token: string;
	database: string;
	space: string;
	character: string;
	world: string;
}

export function loadRuntimeConfig(path: string): RuntimeConfig {
	const value: unknown = JSON.parse(readFileSync(path, "utf8"));
	if (!value || typeof value !== "object") throw new Error("Invalid runtime configuration.");
	const config = value as Record<string, unknown>;
	for (const key of ["token", "database", "space", "character", "world"]) {
		if (typeof config[key] !== "string") throw new Error("Invalid runtime configuration.");
	}
	requireToken(config.token as string);
	if (!isAbsolute(config.database as string)) throw new Error("Database path must be absolute.");
	for (const key of ["space", "character", "world"]) {
		if (!/^[A-Za-z0-9_-]{1,128}$/.test(config[key] as string))
			throw new Error("Invalid scope.");
	}
	return config as unknown as RuntimeConfig;
}
