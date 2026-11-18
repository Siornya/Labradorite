import type { ReviewEpisode } from "@/contracts/generated/review-episode.js";

export type EventTime = NonNullable<ReviewEpisode["happen"]>;
type Point = NonNullable<EventTime["start"]>;
export type TimeRange = { start: number; end: number };

export function validTimestamp(value: string): boolean {
	const match =
		/^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
			value,
		);
	if (!match || !Number.isFinite(Date.parse(value))) return false;
	const year = Number(match[1]),
		month = Number(match[2]),
		day = Number(match[3]);
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]!;
}

function pointRange(point: Point, offset?: string): TimeRange {
	const { value, precision } = point;
	if (precision === "second" || precision === "millisecond") {
		if (
			!validTimestamp(value) ||
			(precision === "second" && value.includes(".")) ||
			(precision === "millisecond" && !/\.\d{3}(Z|[+-])/.test(value))
		)
			throw new Error("Invalid event timestamp");
		const start = Date.parse(value);
		return { start, end: start + (precision === "second" ? 1000 : 1) };
	}
	const patterns = { year: /^\d{4}$/, month: /^\d{4}-\d{2}$/, day: /^\d{4}-\d{2}-\d{2}$/ };
	if (
		!patterns[precision].test(value) ||
		!offset ||
		!/^(Z|[+-](0\d|1[0-4]):[0-5]\d)$/.test(offset) ||
		/14:(?!00)/.test(offset)
	)
		throw new Error("Invalid event calendar date or offset");
	const date = value + (precision === "year" ? "-01-01" : precision === "month" ? "-01" : "");
	if (Number(value.slice(0, 4)) < 1 || !validTimestamp(date + "T00:00:00" + offset))
		throw new Error("Invalid event calendar date");
	const local = new Date(date + "T00:00:00Z");
	const start = Date.parse(date + "T00:00:00" + offset);
	const initial = local.getTime();
	if (precision === "year") local.setUTCFullYear(local.getUTCFullYear() + 1);
	else if (precision === "month") local.setUTCMonth(local.getUTCMonth() + 1);
	else local.setUTCDate(local.getUTCDate() + 1);
	return { start, end: start + local.getTime() - initial };
}

export function validateEventTime(time: EventTime): void {
	if (time.kind === "unknown") {
		if (time.start || time.end || time.utc_offset)
			throw new Error("Unknown event has no bounds");
		if (Boolean(time.basis) !== Boolean(time.source_ids))
			throw new Error("Time evidence requires basis and sources");
		return;
	}
	if (!time.basis || !time.source_ids?.length) throw new Error("Event time requires evidence");
	if (time.kind === "point" && (!time.start || time.end))
		throw new Error("Point requires start only");
	if (time.kind === "interval" && !time.start && !time.end)
		throw new Error("Interval requires a known endpoint");
	const start = time.start && pointRange(time.start, time.utc_offset);
	const end = time.end && pointRange(time.end, time.utc_offset);
	if (start && end && start.start >= end.end) throw new Error("Reversed event interval");
}

// Half-open possible ranges preserve coarse precision without claiming a duration.
export function eventRange(time?: EventTime): TimeRange | null {
	if (!time || time.kind === "unknown") return null;
	const start = time.start && pointRange(time.start, time.utc_offset);
	if (time.kind === "point") return start!;
	const end = time.end && pointRange(time.end, time.utc_offset);
	return { start: start?.start ?? -Infinity, end: end?.end ?? Infinity };
}

export function overlaps(range: TimeRange | null, from?: string, to?: string): boolean {
	return (
		(!from && !to) ||
		(!!range &&
			(!from || range.end > Date.parse(from)) &&
			(!to || range.start <= Date.parse(to)))
	);
}

export function eventOrder(time?: EventTime): number | null {
	const range = eventRange(time);
	return range ? (Number.isFinite(range.start) ? range.start : range.end - 1) : null;
}

export function describeEventTime(time?: EventTime): string {
	if (!time || time.kind === "unknown")
		return "发生时间未知" + (time?.description ? "：" + time.description : "");
	const labels = {
		year: "年精度",
		month: "月精度",
		day: "日精度",
		second: "秒精度",
		millisecond: "毫秒精度",
	};
	const point = (p?: Point) => (p ? `${p.value}（${labels[p.precision]}）` : "未知");
	return (
		(time.kind === "point" ? point(time.start) : `${point(time.start)} 至 ${point(time.end)}`) +
		(time.utc_offset ? ` UTC${time.utc_offset === "Z" ? "+00:00" : time.utc_offset}` : "") +
		(time.basis === "inferred" ? " · 推断" : " · 来源明确陈述") +
		(time.description ? ` · ${time.description}` : "")
	);
}
