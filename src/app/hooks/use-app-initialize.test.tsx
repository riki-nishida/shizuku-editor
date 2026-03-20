import {
	expandedChaptersAtom,
	outlineNodesAtom,
} from "@features/write/model/outline/store";
import { appInitializedAtom } from "@shared/store/ui";
import { createTestWrapper } from "@test/utils";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppInitialize } from "./use-app-initialize";

const { testSelectedWorkAtom, testSelectedNodeAtom } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { atom } = require("jotai") as typeof import("jotai");
	return {
		testSelectedWorkAtom: atom(null),
		testSelectedNodeAtom: atom(null),
	};
});

const mockListWorks = vi.fn().mockResolvedValue({
	ok: true,
	value: [
		{
			id: 1,
			name: "テスト作品",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
		},
	],
});

const mockGetSelectedWorkId = vi.fn().mockResolvedValue({ ok: true, value: 1 });

vi.mock("@features/work", () => ({
	selectedWorkAtom: testSelectedWorkAtom,
	selectedNodeAtom: testSelectedNodeAtom,
}));

vi.mock("@features/work/model", () => ({
	getSelectedWorkId: (...args: unknown[]) => mockGetSelectedWorkId(...args),
	listWorks: (...args: unknown[]) => mockListWorks(...args),
}));

const mockLoadWorkData = vi.fn().mockResolvedValue({
	outline: { chapters: [], scenes: [] },
	selectedNode: null,
	expandedChapters: {},
});

vi.mock("@app/lib/work-loader", () => ({
	loadWorkData: (...args: unknown[]) => mockLoadWorkData(...args),
}));

vi.mock("@shared/lib", () => ({
	unwrapOr: (result: { ok: boolean; value: unknown }, defaultValue: unknown) =>
		result.ok ? result.value : defaultValue,
}));

vi.mock("@features/settings", () => ({
	loadSettingsAtom: {
		init: null,
		read: () => null,
		write: async () => {},
	},
}));

vi.mock("@shared/store/ui", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@shared/store/ui")>();
	return {
		...actual,
		loadPanelSizesAtom: {
			init: null,
			read: () => null,
			write: async () => {},
		},
		loadInspectorCollapsedAtom: {
			init: null,
			read: () => null,
			write: async () => {},
		},
	};
});

vi.mock("@shared/store/master", () => ({
	loadSceneStatusesAtom: {
		init: null,
		read: () => null,
		write: async () => {},
	},
}));

describe("useAppInitialize", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];
	let Wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		Wrapper = testWrapper.Wrapper;

		store.set(appInitializedAtom, false);
		store.set(testSelectedWorkAtom, null);
		store.set(testSelectedNodeAtom, null);
		store.set(expandedChaptersAtom, {});
		store.set(outlineNodesAtom, undefined);
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("isInitializedを返す", async () => {
			const { result } = renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			expect(result.current).toHaveProperty("isInitialized");
			expect(typeof result.current.isInitialized).toBe("boolean");

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});
		});
	});

	describe("初期化処理", () => {
		it("エラーなく初期化処理が実行される", async () => {
			expect(() => {
				renderHook(() => useAppInitialize(), {
					wrapper: Wrapper,
				});
			}).not.toThrow();

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});
		});

		it("初期化完了後にappInitializedAtomがtrueになる", async () => {
			renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});
		});

		it("初期化時にlistWorksとgetSelectedWorkIdが呼ばれる", async () => {
			renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});

			expect(mockListWorks).toHaveBeenCalled();
			expect(mockGetSelectedWorkId).toHaveBeenCalled();
		});

		it("保存された作品IDに対応する作品データがロードされる", async () => {
			renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});

			expect(mockLoadWorkData).toHaveBeenCalledWith(1);
		});

		it("初期化完了後に選択作品がセットされる", async () => {
			renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});

			const selectedWork = store.get(testSelectedWorkAtom) as {
				id: number;
				name: string;
			} | null;
			expect(selectedWork).not.toBeNull();
			expect(selectedWork?.id).toBe(1);
			expect(selectedWork?.name).toBe("テスト作品");
		});

		it("2回目のレンダリングでは初期化が再実行されない", async () => {
			const { rerender } = renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});

			vi.clearAllMocks();
			rerender();

			expect(mockListWorks).not.toHaveBeenCalled();
		});
	});

	describe("戻り値", () => {
		it("isInitializedプロパティのみを持つオブジェクトを返す", async () => {
			const { result } = renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			expect(Object.keys(result.current)).toEqual(["isInitialized"]);

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});
		});
	});

	describe("非同期初期化", () => {
		it("初期化中に複数回呼び出されてもエラーにならない", async () => {
			const { result, rerender } = renderHook(() => useAppInitialize(), {
				wrapper: Wrapper,
			});

			rerender();
			rerender();
			rerender();

			expect(result.current).toHaveProperty("isInitialized");

			await waitFor(() => {
				expect(store.get(appInitializedAtom)).toBe(true);
			});
		});
	});
});

describe("useAppInitialize 統合テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("モジュールが正しくインポートできる", async () => {
		const module = await import("./use-app-initialize");
		expect(module.useAppInitialize).toBeDefined();
		expect(typeof module.useAppInitialize).toBe("function");
	});
});
