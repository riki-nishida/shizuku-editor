import type { AppError } from "@shared/lib/error";
import type { Result } from "@shared/lib/error/result";
import { atom, createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	atomWithOptimisticPersist,
	atomWithOptimisticReload,
	atomWithOptimisticTransform,
} from "./index";

const createError = (message: string): AppError => ({
	code: "INTERNAL_ERROR",
	message,
});

describe("atomWithOptimisticPersist", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
	});

	it("成功時に値を更新する", async () => {
		const baseAtom = atom<number[]>([1, 2, 3]);
		const mockPersist = vi
			.fn()
			.mockResolvedValue({ ok: true, value: undefined });

		const saveAtom = atomWithOptimisticPersist(baseAtom, mockPersist);

		await store.set(saveAtom, [4, 5, 6]);

		expect(store.get(baseAtom)).toEqual([4, 5, 6]);
		expect(mockPersist).toHaveBeenCalledWith([4, 5, 6]);
	});

	it("失敗時にロールバックする", async () => {
		const baseAtom = atom<number[]>([1, 2, 3]);
		const mockPersist = vi.fn().mockResolvedValue({
			ok: false,
			error: createError("Save failed"),
		} as Result<void, AppError>);

		const saveAtom = atomWithOptimisticPersist(baseAtom, mockPersist);

		await store.set(saveAtom, [4, 5, 6]);

		expect(store.get(baseAtom)).toEqual([1, 2, 3]);
	});

	it("失敗時に onError コールバックを呼ぶ", async () => {
		const baseAtom = atom<number[]>([1, 2, 3]);
		const error = createError("Save failed");
		const mockPersist = vi.fn().mockResolvedValue({
			ok: false,
			error,
		} as Result<void, AppError>);
		const onError = vi.fn();

		const saveAtom = atomWithOptimisticPersist(baseAtom, mockPersist, {
			onError,
		});

		await store.set(saveAtom, [4, 5, 6]);

		expect(onError).toHaveBeenCalledWith(error, [1, 2, 3]);
	});

	it("成功時に onSuccess コールバックを呼ぶ", async () => {
		const baseAtom = atom<number[]>([1, 2, 3]);
		const mockPersist = vi
			.fn()
			.mockResolvedValue({ ok: true, value: undefined });
		const onSuccess = vi.fn();

		const saveAtom = atomWithOptimisticPersist(baseAtom, mockPersist, {
			onSuccess,
		});

		await store.set(saveAtom, [4, 5, 6]);

		expect(onSuccess).toHaveBeenCalledWith([4, 5, 6]);
	});

	it("楽観的に即座に値を更新する", async () => {
		const baseAtom = atom<string>("initial");
		let resolvePromise: ((value: Result<void, AppError>) => void) | undefined;
		const pendingPromise = new Promise<Result<void, AppError>>((resolve) => {
			resolvePromise = resolve;
		});
		const mockPersist = vi.fn().mockReturnValue(pendingPromise);

		const saveAtom = atomWithOptimisticPersist(baseAtom, mockPersist);

		const savePromise = store.set(saveAtom, "updated");

		expect(store.get(baseAtom)).toBe("updated");

		resolvePromise?.({ ok: true, value: undefined });
		await savePromise;

		expect(store.get(baseAtom)).toBe("updated");
	});
});

describe("atomWithOptimisticTransform", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
	});

	it("transform 関数で値を変換して更新する", async () => {
		const baseAtom = atom<boolean>(false);
		const mockPersist = vi
			.fn()
			.mockResolvedValue({ ok: true, value: undefined });

		const toggleAtom = atomWithOptimisticTransform(
			baseAtom,
			(current) => !current,
			mockPersist,
		);

		await store.set(toggleAtom);

		expect(store.get(baseAtom)).toBe(true);
		expect(mockPersist).toHaveBeenCalledWith(true);
	});

	it("失敗時にロールバックする", async () => {
		const baseAtom = atom<boolean>(false);
		const mockPersist = vi.fn().mockResolvedValue({
			ok: false,
			error: createError("Toggle failed"),
		} as Result<void, AppError>);

		const toggleAtom = atomWithOptimisticTransform(
			baseAtom,
			(current) => !current,
			mockPersist,
		);

		await store.set(toggleAtom);

		expect(store.get(baseAtom)).toBe(false);
	});

	it("複数回の呼び出しで正しく動作する", async () => {
		const baseAtom = atom<number>(0);
		const mockPersist = vi
			.fn()
			.mockResolvedValue({ ok: true, value: undefined });

		const incrementAtom = atomWithOptimisticTransform(
			baseAtom,
			(current) => current + 1,
			mockPersist,
		);

		await store.set(incrementAtom);
		await store.set(incrementAtom);
		await store.set(incrementAtom);

		expect(store.get(baseAtom)).toBe(3);
		expect(mockPersist).toHaveBeenCalledTimes(3);
	});
});

describe("atomWithOptimisticReload", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
	});

	it("成功時に値を更新する", async () => {
		const baseAtom = atom<string[]>(["a", "b", "c"]);
		const mockReload = vi.fn();

		const reorderAtom = atomWithOptimisticReload(
			baseAtom,
			async (_current, newOrder: string[]) => {
				return { value: newOrder, ok: true };
			},
			mockReload,
		);

		await store.set(reorderAtom, ["c", "b", "a"]);

		expect(store.get(baseAtom)).toEqual(["c", "b", "a"]);
		expect(mockReload).not.toHaveBeenCalled();
	});

	it("失敗時に reload を呼ぶ", async () => {
		const baseAtom = atom<string[]>(["a", "b", "c"]);
		const mockReload = vi.fn().mockResolvedValue(undefined);

		const reorderAtom = atomWithOptimisticReload(
			baseAtom,
			async (_current, newOrder: string[]) => {
				return { value: newOrder, ok: false };
			},
			mockReload,
		);

		await store.set(reorderAtom, ["c", "b", "a"]);

		expect(mockReload).toHaveBeenCalled();
	});

	it("失敗時に onError コールバックを呼ぶ", async () => {
		const baseAtom = atom<string[]>(["a", "b", "c"]);
		const mockReload = vi.fn().mockResolvedValue(undefined);
		const onError = vi.fn();

		const reorderAtom = atomWithOptimisticReload(
			baseAtom,
			async (_current, newOrder: string[]) => ({ value: newOrder, ok: false }),
			mockReload,
			{ onError },
		);

		await store.set(reorderAtom, ["c", "b", "a"]);

		expect(onError).toHaveBeenCalled();
	});

	it("複数の引数を受け取れる", async () => {
		const baseAtom = atom<{ items: string[]; selected: string | null }>({
			items: ["a", "b", "c"],
			selected: null,
		});
		const mockReload = vi.fn();

		const updateAtom = atomWithOptimisticReload(
			baseAtom,
			async (_current, items: string[], selected: string) => {
				return { value: { items, selected }, ok: true };
			},
			mockReload,
		);

		await store.set(updateAtom, ["x", "y"], "x");

		expect(store.get(baseAtom)).toEqual({ items: ["x", "y"], selected: "x" });
	});
});
