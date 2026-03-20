import type { ChapterOutline, SceneOutline, WorkOutline } from "@shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestWrapper } from "@/test/utils";
import { selectedSceneAtom } from "../editor/store";
import type { Scene } from "../editor/types";
import {
	addChapterAtom,
	addingNodeAtom,
	addSceneAtom,
	chapterToExpandAtom,
	draggingNodeAtom,
	editingNodeIdAtom,
	expandedChaptersAtom,
	initializeOutlineAtom,
	loadOutlineNodesAtom,
	outlineNodesAtom,
	permanentDeleteChapterAtom,
	permanentDeleteSceneAtom,
	reorderSceneAtom,
	restoreChapterAtom,
	restoreSceneAtom,
	softDeleteChapterAtom,
	softDeleteSceneAtom,
	updateChapterTitleAtom,
	updateSceneTitleAtom,
	updateSceneWordCountAtom,
} from "./store";

vi.mock("./commands", () => ({
	getWorkOutline: vi.fn(),
}));

import { getWorkOutline } from "./commands";

const mockGetWorkOutline = vi.mocked(getWorkOutline);

describe("outline/store", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	const createChapter = (
		overrides: Partial<ChapterOutline> = {},
	): ChapterOutline => ({
		id: "chapter-1",
		title: "第1章",
		sort_order: 0,
		is_deleted: false,
		word_count: 100,
		...overrides,
	});

	const createScene = (
		overrides: Partial<SceneOutline> = {},
	): SceneOutline => ({
		id: "scene-1",
		chapter_id: "chapter-1",
		title: "シーン1",
		sort_order: 0,
		is_deleted: false,
		word_count: 50,
		...overrides,
	});

	const createWorkOutline = (
		chapters: ChapterOutline[] = [],
		scenes: SceneOutline[] = [],
	): WorkOutline => ({
		chapters,
		scenes,
	});

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		vi.clearAllMocks();
	});

	describe("outlineNodesAtom", () => {
		it("初期値は undefined", () => {
			const nodes = store.get(outlineNodesAtom);
			expect(nodes).toBeUndefined();
		});

		it("WorkOutline を設定できる", () => {
			const outline = createWorkOutline([createChapter()], [createScene()]);
			store.set(outlineNodesAtom, outline);

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters).toHaveLength(1);
			expect(nodes?.scenes).toHaveLength(1);
		});
	});

	describe("loadOutlineNodesAtom", () => {
		it("作品のアウトラインを読み込める", async () => {
			const outline = createWorkOutline(
				[createChapter({ id: "ch-1" })],
				[createScene({ id: "sc-1" })],
			);
			mockGetWorkOutline.mockResolvedValueOnce({ ok: true, value: outline });

			await store.set(loadOutlineNodesAtom, "work-123");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes).toEqual(outline);
			expect(mockGetWorkOutline).toHaveBeenCalledWith("work-123");
		});

		it("読み込み失敗時はアウトラインを更新しない", async () => {
			const existingOutline = createWorkOutline([createChapter()], []);
			store.set(outlineNodesAtom, existingOutline);
			mockGetWorkOutline.mockResolvedValueOnce({
				ok: false,
				error: { code: "NOT_FOUND", message: "Work not found" },
			});

			await store.set(loadOutlineNodesAtom, "invalid-work");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes).toEqual(existingOutline);
		});
	});

	describe("addChapterAtom", () => {
		it("チャプターを追加できる", () => {
			store.set(outlineNodesAtom, createWorkOutline([], []));
			const newChapter = createChapter({ id: "new-chapter" });

			store.set(addChapterAtom, newChapter);

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters).toHaveLength(1);
			expect(nodes?.chapters[0].id).toBe("new-chapter");
		});

		it("アウトラインがない場合は何もしない", () => {
			store.set(outlineNodesAtom, undefined);
			const newChapter = createChapter();

			store.set(addChapterAtom, newChapter);

			expect(store.get(outlineNodesAtom)).toBeUndefined();
		});
	});

	describe("addSceneAtom", () => {
		it("シーンを追加できる", () => {
			store.set(outlineNodesAtom, createWorkOutline([createChapter()], []));
			const newScene = createScene({ id: "new-scene" });

			store.set(addSceneAtom, newScene);

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes).toHaveLength(1);
			expect(nodes?.scenes[0].id).toBe("new-scene");
		});
	});

	describe("softDeleteChapterAtom", () => {
		it("チャプターをソフトデリートできる", () => {
			const chapter = createChapter({ id: "ch-1", is_deleted: false });
			const scene1 = createScene({ id: "sc-1", chapter_id: "ch-1" });
			const scene2 = createScene({ id: "sc-2", chapter_id: "ch-2" });
			store.set(
				outlineNodesAtom,
				createWorkOutline([chapter], [scene1, scene2]),
			);

			store.set(softDeleteChapterAtom, "ch-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters[0].is_deleted).toBe(true);
			expect(nodes?.scenes.find((s) => s.id === "sc-1")?.is_deleted).toBe(true);
			expect(nodes?.scenes.find((s) => s.id === "sc-2")?.is_deleted).toBe(
				false,
			);
		});
	});

	describe("softDeleteSceneAtom", () => {
		it("シーンをソフトデリートできる", () => {
			const scene = createScene({ id: "sc-1", is_deleted: false });
			store.set(outlineNodesAtom, createWorkOutline([], [scene]));

			store.set(softDeleteSceneAtom, "sc-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes[0].is_deleted).toBe(true);
		});
	});

	describe("updateChapterTitleAtom", () => {
		it("チャプターのタイトルを更新できる", () => {
			const chapter = createChapter({ id: "ch-1", title: "旧タイトル" });
			store.set(outlineNodesAtom, createWorkOutline([chapter], []));

			store.set(updateChapterTitleAtom, {
				chapterId: "ch-1",
				title: "新タイトル",
			});

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters[0].title).toBe("新タイトル");
		});
	});

	describe("updateSceneTitleAtom", () => {
		it("シーンのタイトルを更新できる", () => {
			const scene = createScene({ id: "sc-1", title: "旧タイトル" });
			store.set(outlineNodesAtom, createWorkOutline([], [scene]));

			store.set(updateSceneTitleAtom, { sceneId: "sc-1", title: "新タイトル" });

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes[0].title).toBe("新タイトル");
		});

		it("選択中のシーンも同時に更新される", () => {
			const scene = createScene({ id: "sc-1", title: "旧タイトル" });
			store.set(outlineNodesAtom, createWorkOutline([], [scene]));

			const selectedScene: Scene = {
				id: "sc-1",
				chapter_id: "ch-1",
				title: "旧タイトル",
				synopsis: "",
				content_text: "",
				content_markups: "[]",
				word_count: 0,
				sort_order: 0,
				is_deleted: false,
				created_at: "",
				updated_at: "",
			};
			store.set(selectedSceneAtom, selectedScene);

			store.set(updateSceneTitleAtom, { sceneId: "sc-1", title: "新タイトル" });

			const updatedSelectedScene = store.get(selectedSceneAtom);
			expect(updatedSelectedScene?.title).toBe("新タイトル");
		});
	});

	describe("restoreChapterAtom", () => {
		it("削除済みチャプターを復元できる", () => {
			const chapter = createChapter({ id: "ch-1", is_deleted: true });
			const scene = createScene({
				id: "sc-1",
				chapter_id: "ch-1",
				is_deleted: true,
			});
			store.set(outlineNodesAtom, createWorkOutline([chapter], [scene]));

			store.set(restoreChapterAtom, "ch-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters[0].is_deleted).toBe(false);
			expect(nodes?.scenes[0].is_deleted).toBe(false);
		});
	});

	describe("restoreSceneAtom", () => {
		it("削除済みシーンを復元できる", () => {
			const scene = createScene({ id: "sc-1", is_deleted: true });
			store.set(outlineNodesAtom, createWorkOutline([], [scene]));

			store.set(restoreSceneAtom, "sc-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes[0].is_deleted).toBe(false);
		});
	});

	describe("permanentDeleteChapterAtom", () => {
		it("チャプターを完全削除できる", () => {
			const chapter1 = createChapter({ id: "ch-1" });
			const chapter2 = createChapter({ id: "ch-2" });
			const scene1 = createScene({ id: "sc-1", chapter_id: "ch-1" });
			const scene2 = createScene({ id: "sc-2", chapter_id: "ch-2" });
			store.set(
				outlineNodesAtom,
				createWorkOutline([chapter1, chapter2], [scene1, scene2]),
			);

			store.set(permanentDeleteChapterAtom, "ch-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.chapters).toHaveLength(1);
			expect(nodes?.chapters[0].id).toBe("ch-2");
			expect(nodes?.scenes).toHaveLength(1);
			expect(nodes?.scenes[0].id).toBe("sc-2");
		});
	});

	describe("permanentDeleteSceneAtom", () => {
		it("シーンを完全削除できる", () => {
			const scene1 = createScene({ id: "sc-1" });
			const scene2 = createScene({ id: "sc-2" });
			store.set(outlineNodesAtom, createWorkOutline([], [scene1, scene2]));

			store.set(permanentDeleteSceneAtom, "sc-1");

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes).toHaveLength(1);
			expect(nodes?.scenes[0].id).toBe("sc-2");
		});
	});

	describe("updateSceneWordCountAtom", () => {
		it("シーンの文字数を更新できる", () => {
			const scene = createScene({ id: "sc-1", word_count: 100 });
			store.set(outlineNodesAtom, createWorkOutline([], [scene]));

			store.set(updateSceneWordCountAtom, { sceneId: "sc-1", wordCount: 250 });

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes[0].word_count).toBe(250);
		});
	});

	describe("initializeOutlineAtom", () => {
		it("アウトラインと展開状態を一括設定できる", () => {
			const outline = createWorkOutline(
				[createChapter({ id: "ch-1" }), createChapter({ id: "ch-2" })],
				[createScene({ id: "sc-1", chapter_id: "ch-1" })],
			);
			const expandedChapters = { "ch-1": true, "ch-2": false };

			store.set(initializeOutlineAtom, { outline, expandedChapters });

			expect(store.get(outlineNodesAtom)).toEqual(outline);
			expect(store.get(expandedChaptersAtom)).toEqual(expandedChapters);
		});

		it("既存のアウトラインを上書きできる", () => {
			const oldOutline = createWorkOutline(
				[createChapter({ id: "old-ch" })],
				[],
			);
			store.set(outlineNodesAtom, oldOutline);
			store.set(expandedChaptersAtom, { "old-ch": true });

			const newOutline = createWorkOutline(
				[createChapter({ id: "new-ch" })],
				[createScene({ id: "new-sc", chapter_id: "new-ch" })],
			);
			store.set(initializeOutlineAtom, {
				outline: newOutline,
				expandedChapters: { "new-ch": true },
			});

			expect(store.get(outlineNodesAtom)).toEqual(newOutline);
			expect(store.get(expandedChaptersAtom)).toEqual({ "new-ch": true });
		});
	});

	describe("reorderSceneAtom", () => {
		it("シーンを前方に移動できる", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 0 }),
				createScene({ id: "sc-2", chapter_id: "ch-1", sort_order: 1 }),
				createScene({ id: "sc-3", chapter_id: "ch-1", sort_order: 2 }),
			];
			store.set(
				outlineNodesAtom,
				createWorkOutline([createChapter({ id: "ch-1" })], scenes),
			);

			store.set(reorderSceneAtom, {
				sceneId: "sc-3",
				chapterId: "ch-1",
				newIndex: 0,
			});

			const nodes = store.get(outlineNodesAtom);
			const reordered = nodes?.scenes
				.filter((s) => s.chapter_id === "ch-1")
				.sort((a, b) => a.sort_order - b.sort_order);
			expect(reordered?.map((s) => s.id)).toEqual(["sc-3", "sc-1", "sc-2"]);
		});

		it("シーンを後方に移動できる", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 0 }),
				createScene({ id: "sc-2", chapter_id: "ch-1", sort_order: 1 }),
				createScene({ id: "sc-3", chapter_id: "ch-1", sort_order: 2 }),
			];
			store.set(
				outlineNodesAtom,
				createWorkOutline([createChapter({ id: "ch-1" })], scenes),
			);

			store.set(reorderSceneAtom, {
				sceneId: "sc-1",
				chapterId: "ch-1",
				newIndex: 2,
			});

			const nodes = store.get(outlineNodesAtom);
			const reordered = nodes?.scenes
				.filter((s) => s.chapter_id === "ch-1")
				.sort((a, b) => a.sort_order - b.sort_order);
			expect(reordered?.map((s) => s.id)).toEqual(["sc-2", "sc-3", "sc-1"]);
		});

		it("削除済みシーンはリオーダー対象外", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 0 }),
				createScene({
					id: "sc-2",
					chapter_id: "ch-1",
					sort_order: 1,
					is_deleted: true,
				}),
				createScene({ id: "sc-3", chapter_id: "ch-1", sort_order: 2 }),
			];
			store.set(
				outlineNodesAtom,
				createWorkOutline([createChapter({ id: "ch-1" })], scenes),
			);

			store.set(reorderSceneAtom, {
				sceneId: "sc-3",
				chapterId: "ch-1",
				newIndex: 0,
			});

			const nodes = store.get(outlineNodesAtom);

			const active = nodes?.scenes
				.filter((s) => !s.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order);
			expect(active?.map((s) => s.id)).toEqual(["sc-3", "sc-1"]);

			const deleted = nodes?.scenes.find((s) => s.id === "sc-2");
			expect(deleted?.sort_order).toBe(1);
		});

		it("他のチャプターのシーンには影響しない", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 0 }),
				createScene({ id: "sc-2", chapter_id: "ch-1", sort_order: 1 }),
				createScene({ id: "sc-other", chapter_id: "ch-2", sort_order: 0 }),
			];
			store.set(
				outlineNodesAtom,
				createWorkOutline(
					[createChapter({ id: "ch-1" }), createChapter({ id: "ch-2" })],
					scenes,
				),
			);

			store.set(reorderSceneAtom, {
				sceneId: "sc-2",
				chapterId: "ch-1",
				newIndex: 0,
			});

			const nodes = store.get(outlineNodesAtom);
			const otherScene = nodes?.scenes.find((s) => s.id === "sc-other");
			expect(otherScene?.sort_order).toBe(0);
		});

		it("存在しないシーンIDの場合は何もしない", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 0 }),
				createScene({ id: "sc-2", chapter_id: "ch-1", sort_order: 1 }),
			];
			const outline = createWorkOutline(
				[createChapter({ id: "ch-1" })],
				scenes,
			);
			store.set(outlineNodesAtom, outline);

			store.set(reorderSceneAtom, {
				sceneId: "non-existent",
				chapterId: "ch-1",
				newIndex: 0,
			});

			const nodes = store.get(outlineNodesAtom);
			expect(nodes?.scenes[0].sort_order).toBe(0);
			expect(nodes?.scenes[1].sort_order).toBe(1);
		});

		it("アウトラインがない場合は何もしない", () => {
			store.set(outlineNodesAtom, undefined);

			store.set(reorderSceneAtom, {
				sceneId: "sc-1",
				chapterId: "ch-1",
				newIndex: 0,
			});

			expect(store.get(outlineNodesAtom)).toBeUndefined();
		});

		it("sort_order が 0 ベースで連番になる", () => {
			const scenes = [
				createScene({ id: "sc-1", chapter_id: "ch-1", sort_order: 10 }),
				createScene({ id: "sc-2", chapter_id: "ch-1", sort_order: 20 }),
				createScene({ id: "sc-3", chapter_id: "ch-1", sort_order: 30 }),
			];
			store.set(
				outlineNodesAtom,
				createWorkOutline([createChapter({ id: "ch-1" })], scenes),
			);

			store.set(reorderSceneAtom, {
				sceneId: "sc-2",
				chapterId: "ch-1",
				newIndex: 0,
			});

			const nodes = store.get(outlineNodesAtom);
			const reordered = nodes?.scenes
				.filter((s) => s.chapter_id === "ch-1")
				.sort((a, b) => a.sort_order - b.sort_order);
			expect(reordered?.map((s) => s.sort_order)).toEqual([0, 1, 2]);
			expect(reordered?.map((s) => s.id)).toEqual(["sc-2", "sc-1", "sc-3"]);
		});
	});

	describe("UI state atoms", () => {
		describe("editingNodeIdAtom", () => {
			it("初期値は null", () => {
				expect(store.get(editingNodeIdAtom)).toBeNull();
			});

			it("編集中のノードを設定できる", () => {
				store.set(editingNodeIdAtom, { id: "ch-1", type: "chapter" });
				expect(store.get(editingNodeIdAtom)).toEqual({
					id: "ch-1",
					type: "chapter",
				});
			});
		});

		describe("chapterToExpandAtom", () => {
			it("初期値は null", () => {
				expect(store.get(chapterToExpandAtom)).toBeNull();
			});

			it("展開するチャプターIDを設定できる", () => {
				store.set(chapterToExpandAtom, "ch-1");
				expect(store.get(chapterToExpandAtom)).toBe("ch-1");
			});
		});

		describe("expandedChaptersAtom", () => {
			it("初期値は空オブジェクト", () => {
				expect(store.get(expandedChaptersAtom)).toEqual({});
			});

			it("チャプターの展開状態を管理できる", () => {
				store.set(expandedChaptersAtom, { "ch-1": true, "ch-2": false });
				expect(store.get(expandedChaptersAtom)).toEqual({
					"ch-1": true,
					"ch-2": false,
				});
			});
		});

		describe("draggingNodeAtom", () => {
			it("初期値は type と id が null", () => {
				expect(store.get(draggingNodeAtom)).toEqual({ type: null, id: null });
			});

			it("ドラッグ中のノードを設定できる", () => {
				store.set(draggingNodeAtom, { type: "scene", id: "sc-1" });
				expect(store.get(draggingNodeAtom)).toEqual({
					type: "scene",
					id: "sc-1",
				});
			});
		});

		describe("addingNodeAtom", () => {
			it("初期値は null", () => {
				expect(store.get(addingNodeAtom)).toBeNull();
			});

			it("チャプター追加状態を設定できる", () => {
				store.set(addingNodeAtom, { type: "chapter" });
				expect(store.get(addingNodeAtom)).toEqual({ type: "chapter" });
			});

			it("シーン追加状態を設定できる（chapterId 付き）", () => {
				store.set(addingNodeAtom, { type: "scene", chapterId: "ch-1" });
				expect(store.get(addingNodeAtom)).toEqual({
					type: "scene",
					chapterId: "ch-1",
				});
			});
		});
	});
});
