import type { SelectedNode } from "@features/work/model/types";
import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { testSelectedNodeAtom } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { atom } = require("jotai") as typeof import("jotai");
	return {
		testSelectedNodeAtom: atom<SelectedNode>(null),
	};
});

vi.mock("@shared/lib/commands/app-state", () => ({
	getSplitViewDirection: vi.fn(),
	getSplitViewPanes: vi.fn(),
	getSplitViewRatio: vi.fn(),
	saveSplitViewDirection: vi.fn(),
	saveSplitViewPanes: vi.fn(),
	saveSplitViewRatio: vi.fn(),
}));

vi.mock("@features/work", () => ({
	selectedNodeAtom: testSelectedNodeAtom,
}));

import {
	getSplitViewDirection,
	getSplitViewPanes,
	getSplitViewRatio,
	saveSplitViewDirection,
	saveSplitViewPanes,
	saveSplitViewRatio,
} from "@shared/lib/commands/app-state";
import {
	activePaneAtom,
	isSplitActiveAtom,
	loadSplitViewStateAtom,
	openInActivePaneAtom,
	openInOppositePaneAtom,
	primaryPaneContentAtom,
	saveSplitRatioAtom,
	secondaryPaneContentAtom,
	setActivePaneAtom,
	setPaneContentAtom,
	setSplitDirectionAtom,
	splitDirectionAtom,
	splitRatioAtom,
	splitViewStateAtom,
	swapPanesAtom,
	toggleSplitViewAtom,
} from "./split-view";

const mockGetSplitViewDirection = vi.mocked(getSplitViewDirection);
const mockGetSplitViewPanes = vi.mocked(getSplitViewPanes);
const mockGetSplitViewRatio = vi.mocked(getSplitViewRatio);
const mockSaveSplitViewDirection = vi.mocked(saveSplitViewDirection);
const mockSaveSplitViewPanes = vi.mocked(saveSplitViewPanes);
const mockSaveSplitViewRatio = vi.mocked(saveSplitViewRatio);

describe("split-view store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();

		mockSaveSplitViewDirection.mockResolvedValue({
			ok: true,
			value: undefined,
		});
		mockSaveSplitViewPanes.mockResolvedValue({ ok: true, value: undefined });
		mockSaveSplitViewRatio.mockResolvedValue({ ok: true, value: undefined });
	});

	describe("初期状態", () => {
		it("正しい初期状態を持つ", () => {
			const state = store.get(splitViewStateAtom);
			expect(state).toEqual({
				direction: "none",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});
		});

		it("初期比率が 0.5 である", () => {
			expect(store.get(splitRatioAtom)).toBe(0.5);
		});
	});

	describe("派生 atoms", () => {
		it("splitDirectionAtom が現在の方向を返す", () => {
			expect(store.get(splitDirectionAtom)).toBe("none");

			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});

			expect(store.get(splitDirectionAtom)).toBe("horizontal");
		});

		it("isSplitActiveAtom が方向が none でない場合に true を返す", () => {
			expect(store.get(isSplitActiveAtom)).toBe(false);

			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});

			expect(store.get(isSplitActiveAtom)).toBe(true);
		});

		it("activePaneAtom が現在のアクティブペインを返す", () => {
			expect(store.get(activePaneAtom)).toBe("primary");

			store.set(splitViewStateAtom, {
				direction: "none",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "secondary",
			});

			expect(store.get(activePaneAtom)).toBe("secondary");
		});

		it("primaryPaneContentAtom がプライマリペインの内容を返す", () => {
			expect(store.get(primaryPaneContentAtom)).toEqual({ type: "empty" });

			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});

		it("secondaryPaneContentAtom がセカンダリペインの内容を返す", () => {
			expect(store.get(secondaryPaneContentAtom)).toEqual({ type: "empty" });

			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "scene", sceneId: "scene-2" },
				activePane: "primary",
			});

			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
		});
	});

	describe("toggleSplitViewAtom", () => {
		it("シーンが選択されていない場合は分割を有効にしない", async () => {
			store.set(testSelectedNodeAtom, null);
			await store.set(toggleSplitViewAtom);

			expect(store.get(splitDirectionAtom)).toBe("none");
		});

		it("チャプターが選択されている場合は分割を有効にしない", async () => {
			store.set(testSelectedNodeAtom, { type: "chapter", id: "chapter-1" });
			await store.set(toggleSplitViewAtom);

			expect(store.get(splitDirectionAtom)).toBe("none");
		});

		it("シーンが選択されている場合に水平分割を有効にし、同じシーンを両方に表示する", async () => {
			store.set(testSelectedNodeAtom, { type: "scene", id: "scene-1" });
			await store.set(toggleSplitViewAtom);

			expect(store.get(splitDirectionAtom)).toBe("horizontal");
			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(activePaneAtom)).toBe("primary");
		});

		it("再度トグルすると分割を無効にする", async () => {
			store.set(testSelectedNodeAtom, { type: "scene", id: "scene-1" });
			await store.set(toggleSplitViewAtom);
			await store.set(toggleSplitViewAtom);

			expect(store.get(splitDirectionAtom)).toBe("none");
			expect(store.get(primaryPaneContentAtom)).toEqual({ type: "empty" });
			expect(store.get(secondaryPaneContentAtom)).toEqual({ type: "empty" });
		});

		it("方向とペイン内容を永続化する", async () => {
			store.set(testSelectedNodeAtom, { type: "scene", id: "scene-1" });
			await store.set(toggleSplitViewAtom);

			expect(mockSaveSplitViewDirection).toHaveBeenCalledWith("horizontal");
			expect(mockSaveSplitViewPanes).toHaveBeenCalledWith({
				primarySceneId: "scene-1",
				secondarySceneId: "scene-1",
			});
		});
	});

	describe("setSplitDirectionAtom", () => {
		it("方向を設定する", async () => {
			await store.set(setSplitDirectionAtom, "vertical");

			expect(store.get(splitDirectionAtom)).toBe("vertical");
			expect(mockSaveSplitViewDirection).toHaveBeenCalledWith("vertical");
		});

		it("方向を none に設定するとペインをクリアする", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "scene", sceneId: "scene-2" },
				activePane: "primary",
			});

			await store.set(setSplitDirectionAtom, "none");

			expect(store.get(primaryPaneContentAtom)).toEqual({ type: "empty" });
			expect(store.get(secondaryPaneContentAtom)).toEqual({ type: "empty" });
		});
	});

	describe("setActivePaneAtom", () => {
		it("アクティブペインを変更する", () => {
			store.set(setActivePaneAtom, "secondary");
			expect(store.get(activePaneAtom)).toBe("secondary");

			store.set(setActivePaneAtom, "primary");
			expect(store.get(activePaneAtom)).toBe("primary");
		});
	});

	describe("setPaneContentAtom", () => {
		beforeEach(() => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});
		});

		it("プライマリペインに内容を設定する", async () => {
			await store.set(setPaneContentAtom, {
				pane: "primary",
				content: { type: "scene", sceneId: "scene-1" },
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});

		it("セカンダリペインに内容を設定する", async () => {
			await store.set(setPaneContentAtom, {
				pane: "secondary",
				content: { type: "scene", sceneId: "scene-2" },
			});

			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
		});

		it("同じシーンを両方のペインで開ける（同一シーン並列表示）", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "scene", sceneId: "scene-1" },
				activePane: "primary",
			});

			await store.set(setPaneContentAtom, {
				pane: "primary",
				content: { type: "scene", sceneId: "scene-1" },
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});
	});

	describe("openInActivePaneAtom", () => {
		beforeEach(() => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});
		});

		it("アクティブペインにシーンを開く", async () => {
			await store.set(openInActivePaneAtom, {
				type: "scene",
				sceneId: "scene-1",
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});

		it("セカンダリがアクティブな場合はセカンダリペインに開く", async () => {
			store.set(setActivePaneAtom, "secondary");

			await store.set(openInActivePaneAtom, {
				type: "scene",
				sceneId: "scene-2",
			});

			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
		});

		it("同じシーンを両方のペインで開ける（同一シーン並列表示）", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "empty" },
				secondaryPane: { type: "scene", sceneId: "scene-1" },
				activePane: "primary",
			});

			await store.set(openInActivePaneAtom, {
				type: "scene",
				sceneId: "scene-1",
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});
	});

	describe("openInOppositePaneAtom", () => {
		it("分割が有効でない場合は有効にしてセカンダリペインに開く", async () => {
			await store.set(openInOppositePaneAtom, {
				type: "scene",
				sceneId: "scene-1",
			});

			expect(store.get(splitDirectionAtom)).toBe("horizontal");
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(activePaneAtom)).toBe("secondary");
		});

		it("分割が有効な場合は反対側のペインに開く", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});

			await store.set(openInOppositePaneAtom, {
				type: "scene",
				sceneId: "scene-2",
			});

			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
			expect(store.get(activePaneAtom)).toBe("secondary");
		});

		it("同じシーンを反対側のペインにも開ける（同一シーン並列表示）", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "empty" },
				activePane: "primary",
			});

			await store.set(openInOppositePaneAtom, {
				type: "scene",
				sceneId: "scene-1",
			});

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(activePaneAtom)).toBe("secondary");
		});
	});

	describe("swapPanesAtom", () => {
		it("ペインの内容を入れ替える", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "scene", sceneId: "scene-2" },
				activePane: "primary",
			});

			await store.set(swapPanesAtom);

			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
		});

		it("入れ替えた内容を永続化する", async () => {
			store.set(splitViewStateAtom, {
				direction: "horizontal",
				primaryPane: { type: "scene", sceneId: "scene-1" },
				secondaryPane: { type: "scene", sceneId: "scene-2" },
				activePane: "primary",
			});

			await store.set(swapPanesAtom);

			expect(mockSaveSplitViewPanes).toHaveBeenCalledWith({
				primarySceneId: "scene-2",
				secondarySceneId: "scene-1",
			});
		});
	});

	describe("loadSplitViewStateAtom", () => {
		it("永続化から状態を読み込む", async () => {
			mockGetSplitViewDirection.mockResolvedValue({
				ok: true,
				value: "horizontal",
			});
			mockGetSplitViewPanes.mockResolvedValue({
				ok: true,
				value: {
					primarySceneId: "scene-1",
					secondarySceneId: "scene-2",
				},
			});
			mockGetSplitViewRatio.mockResolvedValue({ ok: true, value: 0.3 });

			await store.set(loadSplitViewStateAtom);

			expect(store.get(splitDirectionAtom)).toBe("horizontal");
			expect(store.get(primaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-1",
			});
			expect(store.get(secondaryPaneContentAtom)).toEqual({
				type: "scene",
				sceneId: "scene-2",
			});
			expect(store.get(splitRatioAtom)).toBe(0.3);
		});

		it("内容がない場合は方向を none に設定する", async () => {
			mockGetSplitViewDirection.mockResolvedValue({
				ok: true,
				value: "horizontal",
			});
			mockGetSplitViewPanes.mockResolvedValue({
				ok: true,
				value: {
					primarySceneId: null,
					secondarySceneId: null,
				},
			});
			mockGetSplitViewRatio.mockResolvedValue({ ok: true, value: 0.5 });

			await store.set(loadSplitViewStateAtom);

			expect(store.get(splitDirectionAtom)).toBe("none");
		});

		it("永続化の失敗を適切に処理する", async () => {
			mockGetSplitViewDirection.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});
			mockGetSplitViewPanes.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});
			mockGetSplitViewRatio.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSplitViewStateAtom);

			expect(store.get(splitDirectionAtom)).toBe("none");
			expect(store.get(splitRatioAtom)).toBe(0.5);
		});
	});

	describe("saveSplitRatioAtom", () => {
		it("比率を保存する", async () => {
			await store.set(saveSplitRatioAtom, 0.7);

			expect(store.get(splitRatioAtom)).toBe(0.7);
			expect(mockSaveSplitViewRatio).toHaveBeenCalledWith(0.7);
		});

		it("保存失敗時にロールバックする", async () => {
			mockSaveSplitViewRatio.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(saveSplitRatioAtom, 0.7);

			expect(store.get(splitRatioAtom)).toBe(0.5);
		});
	});
});
