import type { SourceSpan } from "../contracts/generated/source-span.js";

/** Preserves original text: code points, not UTF-16 units, bytes, or grapheme clusters. */
export function readSourceSpan(text: string, span: SourceSpan): string {
	if (
		!Number.isSafeInteger(span.start) ||
		!Number.isSafeInteger(span.end) ||
		span.start < 0 ||
		span.end <= span.start
	) {
		throw new RangeError("Source spans must be non-empty half-open code point ranges.");
	}

	const points = Array.from(text);
	if (span.end > points.length) {
		throw new RangeError("The source span exceeds the original text.");
	}
	return points.slice(span.start, span.end).join("");
}
