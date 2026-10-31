import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import type { LivenessResponse } from "../contracts/generated/liveness-response.js";
import { schemas } from "../contracts/schemas.js";
import { type Clock, SystemClock } from "../domain/clock.js";
import { publicCode, publicError } from "./errors.js";

export function createApp(options: { clock?: Clock; memoryReady?: boolean } = {}) {
	const clock = options.clock ?? new SystemClock();
	const app = Fastify({
		logger: false,
		bodyLimit: 256 * 1024,
		requestIdHeader: false,
		genReqId: () => randomUUID(),
		ajv: {
			customOptions: {
				coerceTypes: false,
				useDefaults: false,
				removeAdditional: false,
			},
		},
	});

	for (const schema of Object.values(schemas)) app.addSchema(schema);
	const errorSchema = { $ref: `${schemas.errorResponse.$id}#` };

	app.setErrorHandler((error, request, reply) => {
		const response = publicError(publicCode(error), request.id);
		return reply.code(response.status).send(response.body);
	});
	app.setNotFoundHandler((request, reply) => {
		const response = publicError("NOT_FOUND", request.id);
		return reply.code(response.status).send(response.body);
	});

	app.get<{ Reply: LivenessResponse }>(
		"/health/live",
		{ schema: { response: { 200: { $ref: `${schemas.livenessResponse.$id}#` } } } },
		() => ({ status: "alive", stage: "P0-A", checked_at: clock.now().toISOString() }),
	);

	app.get(
		"/health/ready",
		{
			schema: {
				response: {
					200: {
						type: "object",
						properties: { status: { type: "string" }, stage: { type: "string" } },
						required: ["status", "stage"],
						additionalProperties: false,
					},
					503: errorSchema,
				},
			},
		},
		(request, reply) => {
			if (options.memoryReady)
				return reply.code(200).send({ status: "ready", stage: "local-test" });
			const response = publicError("UNAVAILABLE", request.id, {
				reason: "memory_capabilities_not_implemented",
			});
			return reply.code(503).header("Retry-After", "60").send(response.body);
		},
	);

	return app;
}
