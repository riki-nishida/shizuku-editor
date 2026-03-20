import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import { expandedChaptersAtom } from "@features/write/model/outline/store";
import { appInitializedAtom } from "@shared/store/ui";
import type { Work } from "@shared/types";
import { createTestWrapper } from "@test/utils";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistSelection } from "./use-persist-selection";

const mockSaveSelectedNode = vi.fn().mockResolvedValue(undefined);
const mockSaveExpandedChapters = vi.fn().mockResolvedValue(undefined);

vi.mock("@features/work/model/commands", () => ({
	saveSelectedNode: (...args: unknown[]) => mockSaveSelectedNode(...args),
	saveExpandedChapters: (...args: unknown[]) =>
		mockSaveExpandedChapters(...args),
}));

const createTestWork = (id: string, name: string): Work => ({
	id,
	name,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
});

describe("usePersistSelection", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];
	let Wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		Wrapper = testWrapper.Wrapper;

		store.set(selectedWorkAtom, null);
		store.set(selectedNodeAtom, null);
		store.set(expandedChaptersAtom, {});
		store.set(appInitializedAtom, false);
		vi.clearAllMocks();
	});

	describe("初期化前", () => {
		it("初期化前は保存が行われない", () => {
			store.set(selectedWorkAtom, createTestWork("1", "Test Work"));
			store.set(selectedNodeAtom, { id: "1", type: "scene" });

			renderHook(() => usePersistSelection(), { wrapper: Wrapper });

			expect(mockSaveSelectedNode).not.toHaveBeenCalled();
			expect(mockSaveExpandedChapters).not.toHaveBeenCalled();
		});
	});

	describe("初期化後の動作", () => {
		it("選択ノード変更時に正しい引数で保存される", () => {
			store.set(appInitializedAtom, true);
			store.set(selectedWorkAtom, createTestWork("1", "Test Work"));

			const { rerender } = renderHook(() => usePersistSelection(), {
				wrapper: Wrapper,
			});

			act(() => {
				store.set(selectedNodeAtom, { id: "2", type: "scene" });
			});
			rerender();

			expect(mockSaveSelectedNode).toHaveBeenCalledWith("1", {
				id: "2",
				type: "scene",
			});
		});

		it("展開状態変更時に正しい引数で保存される", () => {
			store.set(appInitializedAtom, true);
			store.set(selectedWorkAtom, createTestWork("1", "Test Work"));

			const { rerender } = renderHook(() => usePersistSelection(), {
				wrapper: Wrapper,
			});

			act(() => {
				store.set(expandedChaptersAtom, { "1": true, "2": true });
			});
			rerender();

			expect(mockSaveExpandedChapters).toHaveBeenCalledWith("1", {
				"1": true,
				"2": true,
			});
		});

		it("作品が選択されていない場合は保存されない", () => {
			store.set(appInitializedAtom, true);
			store.set(selectedWorkAtom, null);

			const { rerender } = renderHook(() => usePersistSelection(), {
				wrapper: Wrapper,
			});

			act(() => {
				store.set(selectedNodeAtom, { id: "1", type: "scene" });
			});
			rerender();

			expect(mockSaveSelectedNode).not.toHaveBeenCalled();
		});
	});

	describe("作品変更時", () => {
		it("作品変更後は新しい作品IDで保存される", () => {
			store.set(appInitializedAtom, true);
			store.set(selectedWorkAtom, createTestWork("1", "Test Work"));

			const { rerender } = renderHook(() => usePersistSelection(), {
				wrapper: Wrapper,
			});

			vi.clearAllMocks();

			act(() => {
				store.set(selectedWorkAtom, createTestWork("2", "Test Work 2"));
			});
			rerender();

			act(() => {
				store.set(selectedNodeAtom, { id: "20", type: "scene" });
			});
			rerender();

			expect(mockSaveSelectedNode).toHaveBeenCalledWith("2", {
				id: "20",
				type: "scene",
			});
		});
	});

	describe("アンマウント", () => {
		it("アンマウント時にエラーにならない", () => {
			store.set(appInitializedAtom, true);
			store.set(selectedWorkAtom, createTestWork("1", "Test Work"));

			const { unmount } = renderHook(() => usePersistSelection(), {
				wrapper: Wrapper,
			});

			expect(() => unmount()).not.toThrow();
		});
	});
});
