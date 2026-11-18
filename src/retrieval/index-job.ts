import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { EmbeddingError } from "@/providers/embedding.js";

export interface IndexJobStatus {
	state: "running" | "completed" | "paused" | "stopped" | "cancelled" | "interrupted";
	reason: string | null;
	updated_at: string;
}
interface Lease extends IndexJobStatus {
	owner: string;
	expires_at: number;
}

// A short, renewable lease coordinates CLI and MCP indexing without holding a
// SQLite write transaction across an embedding request. No memory text is stored.
export class IndexJob {
	readonly #owner = randomUUID();
	constructor(
		private readonly db: Database.Database,
		private readonly key: string,
	) {}
	#read(): Lease | undefined {
		const row = this.db.prepare("SELECT value FROM metadata WHERE key=?").get(this.key) as
			| { value: string }
			| undefined;
		return row ? JSON.parse(row.value) : undefined;
	}
	status(): IndexJobStatus | null {
		const job = this.#read();
		if (!job) return null;
		const interrupted = job.state === "running" && job.expires_at <= Date.now();
		return {
			state: interrupted ? "interrupted" : job.state,
			reason: interrupted ? "INDEX_INTERRUPTED" : job.reason,
			updated_at: job.updated_at,
		};
	}
	#value(state: IndexJobStatus["state"], reason: string | null) {
		return JSON.stringify({
			owner: this.#owner,
			expires_at: Date.now() + 30_000,
			state,
			reason,
			updated_at: new Date().toISOString(),
		} satisfies Lease);
	}
	claim() {
		this.db
			.transaction(() => {
				if (this.status()?.state === "running") throw new EmbeddingError("EMBEDDING_BUSY");
				this.db
					.prepare("INSERT OR REPLACE INTO metadata(key,value) VALUES (?,?)")
					.run(this.key, this.#value("running", null));
			})
			.immediate();
	}
	update(state: IndexJobStatus["state"], reason: string | null = null) {
		const result = this.db
			.prepare("UPDATE metadata SET value=? WHERE key=? AND json_extract(value,'$.owner')=?")
			.run(this.#value(state, reason), this.key, this.#owner);
		if (!result.changes) throw new EmbeddingError("EMBEDDING_BUSY");
	}
}
