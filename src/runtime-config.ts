import { validateEmbeddingConfig, type EmbeddingConfig } from "./providers/embedding.js";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

export interface RuntimeConfig {
	database: string;
	embedding?: EmbeddingConfig;
	local_model?: { file: string; sha256: string };
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
			(key) =>
				!["database", "space", "character", "world", "embedding", "local_model"].includes(
					key,
				),
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
	if (config.embedding !== undefined)
		config.embedding = validateEmbeddingConfig(config.embedding);
	if (config.local_model !== undefined) {
		const model = config.local_model as RuntimeConfig["local_model"];
		const embedding = config.embedding as EmbeddingConfig | undefined;
		if (
			!model ||
			typeof model.file !== "string" ||
			!isAbsolute(model.file) ||
			typeof model.sha256 !== "string" ||
			!/^[a-f0-9]{64}$/.test(model.sha256) ||
			embedding?.model !== "gguf-" + model.sha256 ||
			!/^http:\/\/127\.0\.0\.1:[1-9]\d{0,4}\/v1\/embeddings$/.test(embedding.endpoint) ||
			embedding.api_key_env ||
			embedding.request_dimensions
		)
			throw new Error("Invalid managed embedding configuration.");
	}
	return config as unknown as RuntimeConfig;
}
