const ErrorCode = {
	DATABASE_ERROR: "DATABASE_ERROR",
	NOT_FOUND: "NOT_FOUND",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	IO_ERROR: "IO_ERROR",
	SERIALIZATION_ERROR: "SERIALIZATION_ERROR",
	TAURI_ERROR: "TAURI_ERROR",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

type AppErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type AppError = {
	code: AppErrorCode;
	message: string;
	command?: string;
	cause?: unknown;
};

export const toAppError = (error: unknown, command?: string): AppError => {
	if (isRustError(error)) {
		const code = isValidErrorCode(error.code)
			? error.code
			: ErrorCode.UNKNOWN_ERROR;
		return createAppError(code, error.message, { command, cause: error });
	}

	if (typeof error === "string") {
		return createAppError(ErrorCode.UNKNOWN_ERROR, error, {
			command,
			cause: error,
		});
	}

	if (error instanceof Error) {
		return createAppError(ErrorCode.UNKNOWN_ERROR, error.message, {
			command,
			cause: error,
		});
	}

	return createAppError(ErrorCode.UNKNOWN_ERROR, "Unknown error occurred", {
		command,
		cause: error,
	});
};

type RustError = {
	code: string;
	message: string;
};

function isRustError(error: unknown): error is RustError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"message" in error &&
		typeof (error as RustError).code === "string" &&
		typeof (error as RustError).message === "string"
	);
}

function isValidErrorCode(code: string): code is AppErrorCode {
	return Object.values(ErrorCode).includes(code as AppErrorCode);
}

function createAppError(
	code: AppErrorCode,
	message: string,
	options?: { command?: string; cause?: unknown },
): AppError {
	return {
		code,
		message,
		...options,
	};
}
