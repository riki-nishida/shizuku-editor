import type { AppError } from "@shared/lib/error";
import type { Result } from "@shared/lib/error/result";
import { atom, createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	atomWithOptimisticPersist,
	atomWithOptimisticReload,
	atomWithOptimisticTransform,
	atomWithOptimisticUpdate,
} from ".";

describe("optimistic", () => {
	let store: ReturnType<typeof createStore>;

	const mockError: AppError = {
		code: "DATABASE_ERROR",
		message: "DB error",
	};

	beforeEach(() => {
		store = createStore();
	});

	describe("atomWithOptimisticPersist", () => {
		it("成功時に値が更新される", async () => {
			const baseAtom = atom(10);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: true, value: undefined }),
			);
			const saveAtom = atomWithOptimisticPersist(baseAtom, persistFn);

			await store.set(saveAtom, 20);

			expect(store.get(baseAtom)).toBe(20);
			expect(persistFn).toHaveBeenCalledWith(20);
		});

		it("失敗時にロールバックされる", async () => {
			const baseAtom = atom(10);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const saveAtom = atomWithOptimisticPersist(baseAtom, persistFn);

			await store.set(saveAtom, 20);

			expect(store.get(baseAtom)).toBe(10);
		});

		it("成功時に onSuccess が呼ばれる", async () => {
			const baseAtom = atom("hello");
			const persistFn = vi.fn<(v: string) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: true, value: undefined }),
			);
			const onSuccess = vi.fn();
			const saveAtom = atomWithOptimisticPersist(baseAtom, persistFn, {
				onSuccess,
			});

			await store.set(saveAtom, "world");

			expect(onSuccess).toHaveBeenCalledWith("world");
		});

		it("失敗時に onError がロールバック後の値で呼ばれる", async () => {
			const baseAtom = atom("original");
			const persistFn = vi.fn<(v: string) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const onError = vi.fn();
			const saveAtom = atomWithOptimisticPersist(baseAtom, persistFn, {
				onError,
			});

			await store.set(saveAtom, "changed");

			expect(onError).toHaveBeenCalledWith(mockError, "original");
		});

		it("オプションなしでも動作する", async () => {
			const baseAtom = atom(0);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const saveAtom = atomWithOptimisticPersist(baseAtom, persistFn);

			await store.set(saveAtom, 5);

			expect(store.get(baseAtom)).toBe(0);
		});
	});

	describe("atomWithOptimisticTransform", () => {
		it("変換関数で値を更新できる", async () => {
			const baseAtom = atom(false);
			const persistFn = vi.fn<(v: boolean) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: true, value: undefined }),
			);
			const toggleAtom = atomWithOptimisticTransform(
				baseAtom,
				(current) => !current,
				persistFn,
			);

			await store.set(toggleAtom);

			expect(store.get(baseAtom)).toBe(true);
			expect(persistFn).toHaveBeenCalledWith(true);
		});

		it("失敗時に変換前の値にロールバックされる", async () => {
			const baseAtom = atom(100);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const doubleAtom = atomWithOptimisticTransform(
				baseAtom,
				(current) => current * 2,
				persistFn,
			);

			await store.set(doubleAtom);

			expect(store.get(baseAtom)).toBe(100);
		});

		it("成功時に onSuccess が変換後の値で呼ばれる", async () => {
			const baseAtom = atom(5);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: true, value: undefined }),
			);
			const onSuccess = vi.fn();
			const incrementAtom = atomWithOptimisticTransform(
				baseAtom,
				(current) => current + 1,
				persistFn,
				{ onSuccess },
			);

			await store.set(incrementAtom);

			expect(onSuccess).toHaveBeenCalledWith(6);
		});

		it("失敗時に onError がロールバック後の値で呼ばれる", async () => {
			const baseAtom = atom(5);
			const persistFn = vi.fn<(v: number) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const onError = vi.fn();
			const incrementAtom = atomWithOptimisticTransform(
				baseAtom,
				(current) => current + 1,
				persistFn,
				{ onError },
			);

			await store.set(incrementAtom);

			expect(onError).toHaveBeenCalledWith(mockError, 5);
		});
	});

	describe("atomWithOptimisticUpdate", () => {
		it("引数付きで値を更新できる", async () => {
			const baseAtom = atom<Record<string, boolean>>({
				a: false,
				b: false,
			});
			const persistFn = vi.fn<
				(v: Record<string, boolean>) => Promise<Result<unknown>>
			>(() => Promise.resolve({ ok: true, value: undefined }));
			const toggleKeyAtom = atomWithOptimisticUpdate(
				baseAtom,
				(current, key: string) => ({
					...current,
					[key]: !current[key],
				}),
				persistFn,
			);

			await store.set(toggleKeyAtom, "a");

			expect(store.get(baseAtom)).toEqual({ a: true, b: false });
			expect(persistFn).toHaveBeenCalledWith({ a: true, b: false });
		});

		it("失敗時に引数適用前の値にロールバックされる", async () => {
			const baseAtom = atom<string[]>(["x"]);
			const persistFn = vi.fn<(v: string[]) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const pushAtom = atomWithOptimisticUpdate(
				baseAtom,
				(current, item: string) => [...current, item],
				persistFn,
			);

			await store.set(pushAtom, "y");

			expect(store.get(baseAtom)).toEqual(["x"]);
		});

		it("成功時に onSuccess が更新後の値で呼ばれる", async () => {
			const baseAtom = atom<number[]>([1, 2]);
			const persistFn = vi.fn<(v: number[]) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: true, value: undefined }),
			);
			const onSuccess = vi.fn();
			const appendAtom = atomWithOptimisticUpdate(
				baseAtom,
				(current, n: number) => [...current, n],
				persistFn,
				{ onSuccess },
			);

			await store.set(appendAtom, 3);

			expect(onSuccess).toHaveBeenCalledWith([1, 2, 3]);
		});

		it("失敗時に onError がロールバック後の値で呼ばれる", async () => {
			const baseAtom = atom<number[]>([1, 2]);
			const persistFn = vi.fn<(v: number[]) => Promise<Result<unknown>>>(() =>
				Promise.resolve({ ok: false, error: mockError }),
			);
			const onError = vi.fn();
			const appendAtom = atomWithOptimisticUpdate(
				baseAtom,
				(current, n: number) => [...current, n],
				persistFn,
				{ onError },
			);

			await store.set(appendAtom, 3);

			expect(onError).toHaveBeenCalledWith(mockError, [1, 2]);
		});
	});

	describe("atomWithOptimisticReload", () => {
		it("成功時に更新された値が反映される", async () => {
			const baseAtom = atom(10);
			const updateFn = vi.fn((_current: number, n: number) => ({
				value: n,
				ok: true,
			}));
			const reloadFn = vi.fn(() => Promise.resolve());
			const reloadAtom = atomWithOptimisticReload(baseAtom, updateFn, reloadFn);

			await store.set(reloadAtom, 42);

			expect(store.get(baseAtom)).toBe(42);
			expect(reloadFn).not.toHaveBeenCalled();
		});

		it("失敗時にリロードが呼ばれる", async () => {
			const baseAtom = atom(10);
			const updateFn = vi.fn((_current: number, n: number) => ({
				value: n,
				ok: false,
			}));
			const reloadFn = vi.fn(() => Promise.resolve());
			const reloadAtom = atomWithOptimisticReload(baseAtom, updateFn, reloadFn);

			await store.set(reloadAtom, 42);

			expect(reloadFn).toHaveBeenCalledOnce();
		});

		it("失敗時に onError が呼ばれる", async () => {
			const baseAtom = atom("data");
			const updateFn = vi.fn((_current: string, val: string) => ({
				value: val,
				ok: false,
			}));
			const reloadFn = vi.fn(() => Promise.resolve());
			const onError = vi.fn();
			const reloadAtom = atomWithOptimisticReload(
				baseAtom,
				updateFn,
				reloadFn,
				{ onError },
			);

			await store.set(reloadAtom, "new");

			expect(onError).toHaveBeenCalledOnce();
		});

		it("成功時にリロードも onError も呼ばれない", async () => {
			const baseAtom = atom(0);
			const updateFn = vi.fn((_current: number, n: number) => ({
				value: n,
				ok: true,
			}));
			const reloadFn = vi.fn(() => Promise.resolve());
			const onError = vi.fn();
			const reloadAtom = atomWithOptimisticReload(
				baseAtom,
				updateFn,
				reloadFn,
				{ onError },
			);

			await store.set(reloadAtom, 99);

			expect(reloadFn).not.toHaveBeenCalled();
			expect(onError).not.toHaveBeenCalled();
		});

		it("非同期の updateFn でも動作する", async () => {
			const baseAtom = atom<string[]>([]);
			const updateFn = vi.fn(async (_current: string[], item: string) => ({
				value: [item],
				ok: true,
			}));
			const reloadFn = vi.fn(() => Promise.resolve());
			const reloadAtom = atomWithOptimisticReload(baseAtom, updateFn, reloadFn);

			await store.set(reloadAtom, "hello");

			expect(store.get(baseAtom)).toEqual(["hello"]);
		});

		it("失敗時でも updateFn の value は一旦反映される", async () => {
			const values: number[] = [];
			const baseAtom = atom(0);
			const updateFn = vi.fn((_current: number, n: number) => ({
				value: n,
				ok: false,
			}));
			const reloadFn = vi.fn(async () => {
				values.push(store.get(baseAtom));
			});
			const reloadAtom = atomWithOptimisticReload(baseAtom, updateFn, reloadFn);

			await store.set(reloadAtom, 50);

			expect(values).toEqual([50]);
		});
	});
});
