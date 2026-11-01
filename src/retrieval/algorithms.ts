export const ANALYZER_VERSION = "unicode-zh-unigram-bigram-v1";
export const FUSION_VERSION = "rrf-k60-v1";

/** Search-only normalization; authoritative text and its code point spans are unchanged. */
export function analyze(text: string): string[] {
	const chars = Array.from(text.normalize("NFKC").toLowerCase());
	const tokens: string[] = [];
	let word = "";
	const flush = () => {
		if (word) tokens.push(word);
		word = "";
	};
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i]!;
		if (/\p{Script=Han}/u.test(char)) {
			flush();
			tokens.push(char);
			if (i + 1 < chars.length && /\p{Script=Han}/u.test(chars[i + 1]!))
				tokens.push(char + chars[i + 1]);
		} else if (/[\p{L}\p{N}\p{M}]/u.test(char)) word += char;
		else {
			flush();
			if (/\p{Extended_Pictographic}/u.test(char)) tokens.push(char);
		}
	}
	flush();
	return tokens;
}

// Hex encoding keeps emoji and CJK tokens intact under FTS5's built-in tokenizer.
export function indexText(text: string): string {
	return analyze(text)
		.map((token) => "t" + Buffer.from(token).toString("hex"))
		.join(" ");
}
export function matchExpression(text: string): string | null {
	const tokens = [...new Set(analyze(text))];
	return tokens.length
		? tokens.map((token) => '"t' + Buffer.from(token).toString("hex") + '"').join(" OR ")
		: null;
}
export function reciprocalRankFusion(
	channels: readonly (readonly string[])[],
): { id: string; score: number }[] {
	const scores = new Map<string, number>();
	for (const channel of channels) {
		const unique = [...new Set(channel)];
		unique.forEach((id, index) => scores.set(id, (scores.get(id) ?? 0) + 1 / (60 + index + 1)));
	}
	return [...scores]
		.map(([id, score]) => ({ id, score }))
		.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
export function normalizeVector(value: unknown, dimensions: number): number[] {
	if (
		!Array.isArray(value) ||
		value.length !== dimensions ||
		!value.every((x) => typeof x === "number" && Number.isFinite(x))
	)
		throw new Error("Invalid embedding vector.");
	const scale = Math.max(...value.map((x) => Math.abs(x)));
	if (scale === 0) throw new Error("Zero embedding vector.");
	const scaled = value.map((x) => x / scale);
	const norm = Math.sqrt(scaled.reduce((sum, x) => sum + x * x, 0));
	return scaled.map((x) => x / norm);
}
export function cosineNormalized(a: readonly number[], b: readonly number[]): number {
	if (a.length !== b.length) throw new Error("Embedding dimensions differ.");
	return a.reduce((sum, x, i) => sum + x * b[i]!, 0);
}
