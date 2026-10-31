import organizeMemory from "./schemas/organize-memory.json" with { type: "json" };
import recallMemory from "./schemas/recall-memory.json" with { type: "json" };
import deleteMemory from "./schemas/delete-memory.json" with { type: "json" };
import submitMaterial from "./schemas/submit-material.json" with { type: "json" };
import errorResponse from "./schemas/error-response.json" with { type: "json" };
import livenessResponse from "./schemas/liveness-response.json" with { type: "json" };
import sourceSpan from "./schemas/source-span.json" with { type: "json" };

export const schemas = {
	organizeMemory,
	recallMemory,
	deleteMemory,
	errorResponse,
	livenessResponse,
	sourceSpan,
	submitMaterial,
};
