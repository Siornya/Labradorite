import { normalizeVector } from "../retrieval/algorithms.js";

export interface EmbeddingConfig {
	endpoint: string;
	model: string;
	dimensions: number;
	api_key_env?: string;
	max_requests_per_day: number;
	timeout_ms: number;
	min_similarity?: number;
	request_dimensions?: boolean;
}
export class EmbeddingError extends Error {
	constructor(
		public readonly code:
			| "EMBEDDING_DISABLED"
			| "EMBEDDING_BUDGET"
			| "EMBEDDING_BUSY"
			| "EMBEDDING_CONFIG"
			| "EMBEDDING_UNAVAILABLE"
			| "EMBEDDING_RESPONSE"
			| "EMBEDDING_INPUT",
	) {
		super(code);
	}
}
export function validateEmbeddingConfig(value: unknown): EmbeddingConfig {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new EmbeddingError("EMBEDDING_CONFIG");
	const c = value as Record<string, unknown>;
	if (
		Object.keys(c).some(
			(k) =>
				![
					"endpoint",
					"model",
					"dimensions",
					"api_key_env",
					"max_requests_per_day",
					"timeout_ms",
					"min_similarity",
					"request_dimensions",
				].includes(k),
		)
	)
		throw new EmbeddingError("EMBEDDING_CONFIG");
	if (
		typeof c.endpoint !== "string" ||
		typeof c.model !== "string" ||
		!c.model.trim() ||
		c.model.length > 256
	)
		throw new EmbeddingError("EMBEDDING_CONFIG");
	let url: URL;
	try {
		url = new URL(c.endpoint);
	} catch {
		throw new EmbeddingError("EMBEDDING_CONFIG");
	}
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		(url.protocol !== "https:" &&
			!(
				url.protocol === "http:" &&
				["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
			))
	)
		throw new EmbeddingError("EMBEDDING_CONFIG");
	for (const [key, min, max] of [
		["dimensions", 1, 8192],
		["max_requests_per_day", 0, 100000],
		["timeout_ms", 100, 60000],
	] as const)
		if (typeof c[key] !== "number" || !Number.isInteger(c[key]) || c[key] < min || c[key] > max)
			throw new EmbeddingError("EMBEDDING_CONFIG");
	if (
		c.api_key_env !== undefined &&
		(typeof c.api_key_env !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(c.api_key_env))
	)
		throw new EmbeddingError("EMBEDDING_CONFIG");
	if (
		c.min_similarity !== undefined &&
		(typeof c.min_similarity !== "number" ||
			!Number.isFinite(c.min_similarity) ||
			c.min_similarity < -1 ||
			c.min_similarity > 1)
	)
		throw new EmbeddingError("EMBEDDING_CONFIG");
	if (c.request_dimensions !== undefined && typeof c.request_dimensions !== "boolean")
		throw new EmbeddingError("EMBEDDING_CONFIG");
	return { ...c } as unknown as EmbeddingConfig;
}
export interface EmbeddingProvider {
	readonly config: EmbeddingConfig;
	embed(input: string[]): Promise<{ vectors: number[][]; tokens: number | null }>;
}
export class CompatibleEmbeddingProvider implements EmbeddingProvider {
	readonly config: EmbeddingConfig;
	constructor(
		config: EmbeddingConfig,
		private readonly request: typeof fetch = fetch,
	) {
		this.config = validateEmbeddingConfig(config);
	}
	async embed(input: string[]): Promise<{ vectors: number[][]; tokens: number | null }> {
		if (
			!input.length ||
			input.length > 8 ||
			input.some((x) => !x.trim() || Buffer.byteLength(x) > 16000)
		)
			throw new EmbeddingError("EMBEDDING_INPUT");
		const key = this.config.api_key_env ? process.env[this.config.api_key_env] : undefined;
		if (this.config.api_key_env && !key) throw new EmbeddingError("EMBEDDING_CONFIG");
		try {
			const response = await this.request(this.config.endpoint, {
				method: "POST",
				redirect: "error",
				signal: AbortSignal.timeout(this.config.timeout_ms),
				headers: {
					"content-type": "application/json",
					...(key ? { authorization: `Bearer ${key}` } : {}),
				},
				body: JSON.stringify({
					model: this.config.model,
					input,
					encoding_format: "float",
					...(this.config.request_dimensions
						? { dimensions: this.config.dimensions }
						: {}),
				}),
			});
			if (!response.ok || !response.body) {
				await response.body?.cancel();
				throw new EmbeddingError("EMBEDDING_UNAVAILABLE");
			}
			const reader = response.body.getReader();
			const chunks: Uint8Array[] = [];
			let bytes = 0;
			try {
				while (true) {
					const part = await reader.read();
					if (part.done) break;
					bytes += part.value.byteLength;
					if (bytes > 8 * 1024 * 1024) {
						await reader.cancel();
						throw new EmbeddingError("EMBEDDING_RESPONSE");
					}
					chunks.push(part.value);
				}
			} finally {
				reader.releaseLock();
			}
			const data = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
				model?: unknown;
				data?: unknown;
				usage?: { total_tokens?: unknown };
			};
			if (
				data.model !== this.config.model ||
				!Array.isArray(data.data) ||
				data.data.length !== input.length
			)
				throw new EmbeddingError("EMBEDDING_RESPONSE");
			const vectors: number[][] = [];
			const seen = new Set<number>();
			for (const row of data.data) {
				if (
					!row ||
					typeof row !== "object" ||
					!Number.isInteger(row.index) ||
					row.index < 0 ||
					row.index >= input.length ||
					seen.has(row.index)
				)
					throw new EmbeddingError("EMBEDDING_RESPONSE");
				seen.add(row.index);
				vectors[row.index] = normalizeVector(row.embedding, this.config.dimensions);
			}
			const tokens = data.usage?.total_tokens;
			return {
				vectors,
				tokens:
					typeof tokens === "number" && Number.isSafeInteger(tokens) && tokens >= 0
						? tokens
						: null,
			};
		} catch (error) {
			if (error instanceof EmbeddingError) throw error;
			throw new EmbeddingError("EMBEDDING_UNAVAILABLE");
		}
	}
}
