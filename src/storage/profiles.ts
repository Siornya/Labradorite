import type { ReviewPerson } from "../contracts/generated/review-person.js";
import type { MemoryScope } from "./materials.js";

export const profileSchema = `
	CREATE TABLE people (
		id TEXT PRIMARY KEY, space TEXT NOT NULL REFERENCES spaces(id), world TEXT NOT NULL,
		name TEXT NOT NULL, identity TEXT NOT NULL
	);
	CREATE INDEX people_scope ON people(space, world, id);
	CREATE TABLE person_reviews (
		person TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE, revision INTEGER NOT NULL,
		formed_at TEXT NOT NULL, impression TEXT, withdrawn TEXT, PRIMARY KEY(person, revision)
	);
	CREATE TABLE person_evidence (
		person TEXT NOT NULL, review INTEGER NOT NULL, episode TEXT NOT NULL, revision INTEGER NOT NULL,
		PRIMARY KEY(person, review, episode),
		FOREIGN KEY(person, review) REFERENCES person_reviews(person, revision) ON DELETE CASCADE,
		FOREIGN KEY(episode, revision) REFERENCES episodes(id, revision)
	);
	CREATE INDEX person_evidence_episode ON person_evidence(episode);
`;

interface Reader {
	prepare(sql: string): {
		all(...params: (string | number)[]): unknown[];
	};
}
interface Person {
	id: string;
	name: string;
	identity: string;
}
interface Review {
	revision: number;
	formed_at: string;
	impression: string | null;
	episodes: (ReviewPerson["episodes"][number] & { title: string })[];
}
const peopleFrom =
	" FROM people p JOIN spaces s ON s.id=p.space WHERE p.space=? AND p.world=? AND s.character=?";

export function findPeople(db: Reader, scope: MemoryScope, query: string, after: string = "") {
	const rows = db
		.prepare(
			"SELECT p.id,p.name,p.identity" +
				peopleFrom +
				" AND p.id>? AND (instr(lower(p.name),lower(?)) OR instr(lower(p.identity),lower(?))) ORDER BY p.id LIMIT 51",
		)
		.all(scope.space, scope.world, scope.character, after, query, query) as Person[];
	const items = rows.slice(0, 50);
	return { items, next: rows.length > 50 ? items.at(-1)!.id : null };
}

export function readPerson(db: Reader, scope: MemoryScope, id: string) {
	const rows = db
		.prepare(`SELECT p.name,p.identity,r.revision,r.formed_at,r.impression,r.withdrawn,e.episode,
			e.revision AS episode_revision,json_extract(ep.body,'$.title') AS title
		FROM people p JOIN spaces s ON s.id=p.space JOIN person_reviews r ON r.person=p.id
		LEFT JOIN person_evidence e ON e.person=r.person AND e.review=r.revision
		LEFT JOIN episodes ep ON ep.id=e.episode AND ep.revision=e.revision
		WHERE p.space=? AND p.world=? AND s.character=? AND p.id=? ORDER BY r.revision,e.episode`)
		.all(scope.space, scope.world, scope.character, id) as (Omit<Review, "episodes"> &
		Person & {
			withdrawn: "impression" | "link" | null;
			episode: string;
			episode_revision: number;
			title: string;
		})[];
	const person = rows[0];
	if (!person) return;
	const history: Review[] = [];
	let current_impression: Review | null = null;
	for (const row of rows) {
		if (row.withdrawn) {
			if (row.withdrawn === "impression") current_impression = null;
			continue;
		}
		let review = history.at(-1);
		if (review?.revision !== row.revision) {
			review = {
				revision: row.revision,
				formed_at: row.formed_at,
				impression: row.impression,
				episodes: [],
			};
			history.push(review);
			if (row.impression !== null) current_impression = review;
		}
		review.episodes.push({ id: row.episode, revision: row.episode_revision, title: row.title });
	}
	return {
		id,
		name: person.name,
		identity: person.identity,
		revision: rows.at(-1)!.revision,
		current_impression,
		history,
		semantic_status: "model_proposed" as const,
	};
}
