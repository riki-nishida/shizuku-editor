import { type AppError, toAppError } from "@shared/lib/error";
import { err, ok, type Result } from "@shared/lib/error/result";
import { invoke } from "@tauri-apps/api/core";

export type { Result };

type Payload = Record<string, unknown> | undefined;

export const invokeCommand = async <T>(
	command: string,
	payload?: Payload,
): Promise<Result<T, AppError>> => {
	try {
		const result = await invoke<T>(command, payload);
		return ok(result);
	} catch (error) {
		return err(toAppError(error, command));
	}
};
