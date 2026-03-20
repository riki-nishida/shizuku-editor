import type { AppError } from ".";

export type Result<T, E = AppError> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
	return result.ok ? result.value : defaultValue;
};
