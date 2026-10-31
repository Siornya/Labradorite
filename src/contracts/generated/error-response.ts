/* Generated from JSON Schema. Run vp run contracts:generate; do not edit. */

/**
 * Public error envelope. Messages and details must not contain request bodies or secrets.
 */
export interface ErrorResponse {
	code:
		| "VALIDATION_ERROR"
		| "PAYLOAD_TOO_LARGE"
		| "UNSUPPORTED_MEDIA_TYPE"
		| "NOT_FOUND"
		| "INTERNAL_ERROR"
		| "UNAVAILABLE";
	message: string;
	request_id: string;
	retryable: boolean;
	details: {
		reason?: "memory_capabilities_not_implemented";
	};
}
