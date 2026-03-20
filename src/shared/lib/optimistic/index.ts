import type { AppError } from "@shared/lib/error";
import type { Result } from "@shared/lib/error/result";
import type { PrimitiveAtom, WritableAtom } from "jotai";
import { atom } from "jotai";

export type OptimisticPersistOptions<T> = {
	onError?: (error: AppError, rolledBackValue: T) => void;

	onSuccess?: (value: T) => void;
};

export function atomWithOptimisticPersist<T>(
	baseAtom: PrimitiveAtom<T>,
	persistFn: (value: T) => Promise<Result<unknown, AppError>>,
	options?: OptimisticPersistOptions<T>,
): WritableAtom<null, [T], Promise<void>> {
	return atom(null, async (get, set, newValue: T) => {
		const previous = get(baseAtom);

		set(baseAtom, newValue);

		const result = await persistFn(newValue);

		if (!result.ok) {
			set(baseAtom, previous);
			options?.onError?.(result.error, previous);
		} else {
			options?.onSuccess?.(newValue);
		}
	});
}

export function atomWithOptimisticTransform<T>(
	baseAtom: PrimitiveAtom<T>,
	transformFn: (current: T) => T,
	persistFn: (value: T) => Promise<Result<unknown, AppError>>,
	options?: OptimisticPersistOptions<T>,
): WritableAtom<null, [], Promise<void>> {
	return atom(null, async (get, set) => {
		const previous = get(baseAtom);
		const newValue = transformFn(previous);

		set(baseAtom, newValue);

		const result = await persistFn(newValue);

		if (!result.ok) {
			set(baseAtom, previous);
			options?.onError?.(result.error, previous);
		} else {
			options?.onSuccess?.(newValue);
		}
	});
}

export function atomWithOptimisticUpdate<T, Arg>(
	baseAtom: PrimitiveAtom<T>,
	updateFn: (current: T, arg: Arg) => T,
	persistFn: (value: T) => Promise<Result<unknown, AppError>>,
	options?: OptimisticPersistOptions<T>,
): WritableAtom<null, [Arg], Promise<void>> {
	return atom(null, async (get, set, arg: Arg) => {
		const previous = get(baseAtom);
		const newValue = updateFn(previous, arg);

		set(baseAtom, newValue);

		const result = await persistFn(newValue);

		if (!result.ok) {
			set(baseAtom, previous);
			options?.onError?.(result.error, previous);
		} else {
			options?.onSuccess?.(newValue);
		}
	});
}

export function atomWithOptimisticReload<T, Args extends unknown[]>(
	baseAtom: PrimitiveAtom<T>,
	updateFn: (
		current: T,
		...args: Args
	) => Promise<{ value: T; ok: boolean }> | { value: T; ok: boolean },
	reloadFn: () => Promise<void>,
	options?: { onError?: () => void },
): WritableAtom<null, Args, Promise<void>> {
	return atom(null, async (get, set, ...args: Args) => {
		const current = get(baseAtom);

		const result = await updateFn(current, ...args);

		set(baseAtom, result.value);

		if (!result.ok) {
			await reloadFn();
			options?.onError?.();
		}
	});
}
