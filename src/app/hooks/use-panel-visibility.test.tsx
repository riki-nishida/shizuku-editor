import { selectedNodeAtom } from "@features/work";
import { outlineNodesAtom } from "@features/write/model/outline/store";
import { inspectorCollapsedAtom } from "@shared/store/ui";
import { createTestWrapper } from "@test/utils";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePanelVisibility } from "./use-panel-visibility";

describe("usePanelVisibility", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];
	let Wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		Wrapper = testWrapper.Wrapper;

		store.set(outlineNodesAtom, { chapters: [], scenes: [] });
		store.set(selectedNodeAtom, null);
		store.set(inspectorCollapsedAtom, false);
		vi.clearAllMocks();
	});

	describe("showInspector", () => {
		it("シーン選択時にtrueを返す", () => {
			store.set(selectedNodeAtom, { type: "scene", id: "1" });
			store.set(outlineNodesAtom, {
				chapters: [
					{
						id: "1",
						is_deleted: false,
						title: "",
						sort_order: 0,
						word_count: 0,
					},
				],
				scenes: [
					{
						id: "1",
						chapter_id: "1",
						is_deleted: false,
						title: "",
						sort_order: 0,
						word_count: 0,
					},
				],
			});

			const { result } = renderHook(() => usePanelVisibility(), {
				wrapper: Wrapper,
			});

			expect(result.current.showInspector).toBe(true);
		});

		it("チャプター選択時はfalseを返す", () => {
			store.set(selectedNodeAtom, { type: "chapter", id: "1" });

			const { result } = renderHook(() => usePanelVisibility(), {
				wrapper: Wrapper,
			});

			expect(result.current.showInspector).toBe(false);
		});

		it("inspectorCollapsedを返す", () => {
			store.set(inspectorCollapsedAtom, true);

			const { result } = renderHook(() => usePanelVisibility(), {
				wrapper: Wrapper,
			});

			expect(result.current.inspectorCollapsed).toBe(true);
		});
	});

	describe("削除されたシーンの処理", () => {
		it("選択シーンが削除されている場合showInspectorはfalse", () => {
			store.set(selectedNodeAtom, { type: "scene", id: "1" });
			store.set(outlineNodesAtom, {
				chapters: [
					{
						id: "1",
						is_deleted: false,
						title: "",
						sort_order: 0,
						word_count: 0,
					},
				],
				scenes: [
					{
						id: "1",
						chapter_id: "1",
						is_deleted: true,
						title: "",
						sort_order: 0,
						word_count: 0,
					},
				],
			});

			const { result } = renderHook(() => usePanelVisibility(), {
				wrapper: Wrapper,
			});

			expect(result.current.showInspector).toBe(false);
		});
	});

	describe("戻り値の構造", () => {
		it("必要なプロパティを全て返す", () => {
			const { result } = renderHook(() => usePanelVisibility(), {
				wrapper: Wrapper,
			});

			expect(result.current).toEqual({
				showSidebar: expect.any(Boolean),
				showInspector: expect.any(Boolean),
				inspectorCollapsed: expect.any(Boolean),
			});
		});
	});
});
