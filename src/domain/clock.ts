/** Returns an instant, independently of event time reported by clients. */
export interface Clock {
	now(): Date;
}

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}

/** Deterministic test clock. No real timers or implicit advancement. */
export class ManualClock implements Clock {
	#milliseconds: number;

	constructor(instant: string) {
		this.#milliseconds = Date.parse(instant);
		if (!Number.isFinite(this.#milliseconds)) {
			throw new RangeError("The clock requires a valid instant.");
		}
	}

	now(): Date {
		return new Date(this.#milliseconds);
	}

	advanceBy(milliseconds: number): void {
		const next = this.#milliseconds + milliseconds;
		if (
			!Number.isSafeInteger(milliseconds) ||
			milliseconds < 0 ||
			!Number.isFinite(new Date(next).getTime())
		) {
			throw new RangeError(
				"Clock advancement must be a valid non-negative integer duration.",
			);
		}
		this.#milliseconds = next;
	}
}
