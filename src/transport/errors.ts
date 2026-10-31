import type { ErrorResponse } from "../contracts/generated/error-response.js";

type ErrorCode = ErrorResponse["code"];

const definitions = {
	VALIDATION_ERROR: { status: 400, message: "Request validation failed.", retryable: false },
	PAYLOAD_TOO_LARGE: { status: 413, message: "Request payload is too large.", retryable: false },
	UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Unsupported media type.", retryable: false },
	NOT_FOUND: { status: 404, message: "Resource not found.", retryable: false },
	INTERNAL_ERROR: { status: 500, message: "An internal error occurred.", retryable: false },
	UNAVAILABLE: { status: 503, message: "The memory service is not ready.", retryable: true },
} satisfies Record<ErrorCode, { status: number; message: string; retryable: boolean }>;

export function publicError(
	code: ErrorCode,
	requestId: string,
	details: ErrorResponse["details"] = {},
): { status: number; body: ErrorResponse } {
	const definition = definitions[code];
	return {
		status: definition.status,
		body: {
			code,
			message: definition.message,
			request_id: requestId,
			retryable: definition.retryable,
			details,
		},
	};
}

/** Do not expose exception messages, request bodies, SQL parameters, or validation values. */
export function publicCode(error: unknown): ErrorCode {
	if (error instanceof Error && "statusCode" in error) {
		switch (error.statusCode) {
			case 400:
				return "VALIDATION_ERROR";
			case 413:
				return "PAYLOAD_TOO_LARGE";
			case 415:
				return "UNSUPPORTED_MEDIA_TYPE";
		}
	}
	return "INTERNAL_ERROR";
}
