import { MaterialError, type MaterialStore, type MemoryScope } from "../storage/materials.js";
import { timingSafeEqual } from "node:crypto";
import { createApp } from "./app.js";
export const DAEMON_PORT = 38471;
export function requireToken(value: string | undefined): string {
	if (!value || value.length < 32 || /\s/.test(value))
		throw new Error("Configure FISH_MEMORY_TOKEN with at least 32 non-whitespace characters.");
	return value;
}
export function createDaemon(
	token: string,
	memory?: { store: MaterialStore; scope: MemoryScope; principal: string },
) {
	const secret = Buffer.from(`Bearer ${requireToken(token)}`);
	const app = createApp({ memoryReady: Boolean(memory) });
	app.addHook("onRequest", async (request, reply) => {
		const supplied = Buffer.from(request.headers.authorization ?? "");
		if (
			request.headers.origin ||
			supplied.length !== secret.length ||
			!timingSafeEqual(supplied, secret)
		)
			return reply.code(401).send({ error: "UNAUTHORIZED" });
	});
	if (memory) {
		memory.store.bindScope(memory.scope);
		app.addHook("onClose", async () => {
			memory.store.close();
		});
		app.get("/v1/capabilities", async () => ({
			materials: true,
			organization: "external_model_proposals",
			deletion: "online_only",
			recall: "lexical_bounded",
		}));
		for (const [path, action] of [
			[
				"/v1/organize",
				(input: unknown) => memory.store.organize(memory.principal, memory.scope, input),
			],
			["/v1/recall", (input: unknown) => memory.store.recall(memory.scope, input)],
			[
				"/v1/delete",
				(input: unknown) => memory.store.delete(memory.principal, memory.scope, input),
			],
		] as const)
			app.post(path, async (request, reply) => {
				try {
					return action(request.body);
				} catch (error) {
					if (error instanceof MaterialError)
						return reply
							.code(
								error.code === "NOT_FOUND"
									? 404
									: [
												"IDEMPOTENCY_CONFLICT",
												"STALE_BASIS",
												"REVISION_CONFLICT",
										  ].includes(error.code)
										? 409
										: 400,
							)
							.send({ code: error.code });
					throw error;
				}
			});
		app.get<{ Params: { id: string } }>("/v1/episodes/:id", async (request, reply) => {
			try {
				return {
					episode: memory.store.episode(memory.scope, request.params.id),
					history: memory.store.history(memory.scope, request.params.id),
				};
			} catch (error) {
				if (error instanceof MaterialError)
					return reply.code(404).send({ code: error.code });
				throw error;
			}
		});
		app.post("/v1/materials", async (request, reply) => {
			try {
				const result = memory.store.submit(memory.principal, memory.scope, request.body);
				return reply.code(result.replayed ? 200 : 201).send(result);
			} catch (error) {
				if (error instanceof MaterialError)
					return reply
						.code(
							error.code === "IDEMPOTENCY_CONFLICT"
								? 409
								: error.code === "NOT_FOUND"
									? 404
									: 400,
						)
						.send({ code: error.code });
				throw error;
			}
		});
		app.get<{ Params: { id: string } }>("/v1/materials/:id", async (request, reply) => {
			try {
				return memory.store.read(memory.scope, request.params.id);
			} catch (error) {
				if (error instanceof MaterialError)
					return reply.code(404).send({ code: "NOT_FOUND" });
				throw error;
			}
		});
	}
	return app;
}
