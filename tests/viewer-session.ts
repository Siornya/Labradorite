import assert from "node:assert/strict";
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";

export async function viewerUrl(stream: Readable) {
	for await (const line of createInterface({ input: stream })) {
		if (line.startsWith("http://127.0.0.1:")) return new URL(line);
	}
	throw new Error("Viewer did not provide a login URL");
}

export async function loginViewer(url: URL) {
	const ticket = await fetch(url, { redirect: "manual" });
	const cookie = ticket.headers.get("set-cookie")?.split(";")[0];
	assert.ok(cookie, "Viewer login must issue a session cookie");
	const get = (path: string | URL, headers?: Record<string, string>) =>
		fetch(new URL(path, url), { headers: { cookie, ...headers } });
	const post = (path: string, body?: URLSearchParams, origin = url.origin) =>
		fetch(new URL(path, url), {
			method: "POST",
			headers: { cookie, origin },
			body: body ?? null,
			redirect: "manual",
		});
	const select = async (path = "/select?current=1") => {
		assert.equal((await post(path)).status, 303);
	};
	return { get, post, select };
}
