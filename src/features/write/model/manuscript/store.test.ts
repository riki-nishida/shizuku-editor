import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import {
	enterManuscriptModeAtom,
	exitManuscriptModeAtom,
	isManuscriptModeAtom,
	manuscriptChapterIdAtom,
	manuscriptModifiedScenesAtom,
	manuscriptScenesAtom,
	manuscriptStateAtom,
	markScenesSavedAtom,
	updateManuscriptScenesAtom,
} from "./store";

const mockScene1 = {
	id: "scene-1",
	title: "Scene 1",
	contentText: "Content 1",
	contentMarkups: [],
};

const mockScene2 = {
	id: "scene-2",
	title: "Scene 2",
	contentText: "Content 2",
	contentMarkups: [],
};

describe("manuscript store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
	});

	describe("初期状態", () => {
		it("manuscriptStateAtom は初期状態を持つ", () => {
			const state = store.get(manuscriptStateAtom);
			expect(state.isActive).toBe(false);
			expect(state.chapterId).toBeNull();
			expect(state.scenes).toEqual([]);
			expect(state.modifiedSceneIds.size).toBe(0);
		});

		it("isManuscriptModeAtom は初期状態で false を返す", () => {
			expect(store.get(isManuscriptModeAtom)).toBe(false);
		});

		it("manuscriptScenesAtom は初期状態で空配列を返す", () => {
			expect(store.get(manuscriptScenesAtom)).toEqual([]);
		});

		it("manuscriptChapterIdAtom は初期状態で null を返す", () => {
			expect(store.get(manuscriptChapterIdAtom)).toBeNull();
		});

		it("manuscriptModifiedScenesAtom は初期状態で空の Set を返す", () => {
			expect(store.get(manuscriptModifiedScenesAtom).size).toBe(0);
		});
	});

	describe("enterManuscriptModeAtom", () => {
		it("シーンを持って原稿モードに入る", () => {
			store.set(enterManuscriptModeAtom, {
				chapterId: "chapter-1",
				scenes: [mockScene1, mockScene2],
			});

			expect(store.get(isManuscriptModeAtom)).toBe(true);
			expect(store.get(manuscriptChapterIdAtom)).toBe("chapter-1");
			expect(store.get(manuscriptScenesAtom)).toEqual([mockScene1, mockScene2]);
			expect(store.get(manuscriptModifiedScenesAtom).size).toBe(0);
		});

		it("入る際に変更済みシーンをクリアする", () => {
			store.set(manuscriptStateAtom, {
				isActive: true,
				chapterId: "chapter-old",
				scenes: [mockScene1],
				modifiedSceneIds: new Set(["scene-1"]),
			});

			store.set(enterManuscriptModeAtom, {
				chapterId: "chapter-new",
				scenes: [mockScene2],
			});

			expect(store.get(manuscriptModifiedScenesAtom).size).toBe(0);
		});
	});

	describe("exitManuscriptModeAtom", () => {
		it("初期状態にリセットする", () => {
			store.set(enterManuscriptModeAtom, {
				chapterId: "chapter-1",
				scenes: [mockScene1, mockScene2],
			});

			store.set(exitManuscriptModeAtom);

			expect(store.get(isManuscriptModeAtom)).toBe(false);
			expect(store.get(manuscriptChapterIdAtom)).toBeNull();
			expect(store.get(manuscriptScenesAtom)).toEqual([]);
			expect(store.get(manuscriptModifiedScenesAtom).size).toBe(0);
		});
	});

	describe("updateManuscriptScenesAtom", () => {
		beforeEach(() => {
			store.set(enterManuscriptModeAtom, {
				chapterId: "chapter-1",
				scenes: [mockScene1, mockScene2],
			});
		});

		it("シーンを更新し変更済みシーン ID を追加する", () => {
			const updatedScene1 = { ...mockScene1, contentText: "Updated" };

			store.set(updateManuscriptScenesAtom, {
				scenes: [updatedScene1, mockScene2],
				modifiedSceneIds: new Set(["scene-1"]),
			});

			expect(store.get(manuscriptScenesAtom)).toEqual([
				updatedScene1,
				mockScene2,
			]);
			expect(store.get(manuscriptModifiedScenesAtom).has("scene-1")).toBe(true);
		});

		it("変更済みシーン ID を蓄積する", () => {
			store.set(updateManuscriptScenesAtom, {
				scenes: [mockScene1, mockScene2],
				modifiedSceneIds: new Set(["scene-1"]),
			});

			store.set(updateManuscriptScenesAtom, {
				scenes: [mockScene1, mockScene2],
				modifiedSceneIds: new Set(["scene-2"]),
			});

			const modified = store.get(manuscriptModifiedScenesAtom);
			expect(modified.has("scene-1")).toBe(true);
			expect(modified.has("scene-2")).toBe(true);
			expect(modified.size).toBe(2);
		});

		it("chapterId と isActive を維持する", () => {
			store.set(updateManuscriptScenesAtom, {
				scenes: [mockScene1],
				modifiedSceneIds: new Set(["scene-1"]),
			});

			expect(store.get(isManuscriptModeAtom)).toBe(true);
			expect(store.get(manuscriptChapterIdAtom)).toBe("chapter-1");
		});
	});

	describe("markScenesSavedAtom", () => {
		beforeEach(() => {
			store.set(manuscriptStateAtom, {
				isActive: true,
				chapterId: "chapter-1",
				scenes: [mockScene1, mockScene2],
				modifiedSceneIds: new Set(["scene-1", "scene-2"]),
			});
		});

		it("保存済みシーン ID を変更済みセットから削除する", () => {
			store.set(markScenesSavedAtom, ["scene-1"]);

			const modified = store.get(manuscriptModifiedScenesAtom);
			expect(modified.has("scene-1")).toBe(false);
			expect(modified.has("scene-2")).toBe(true);
			expect(modified.size).toBe(1);
		});

		it("複数の保存済みシーン ID を削除する", () => {
			store.set(markScenesSavedAtom, ["scene-1", "scene-2"]);

			expect(store.get(manuscriptModifiedScenesAtom).size).toBe(0);
		});

		it("存在しないシーン ID を適切に処理する", () => {
			store.set(markScenesSavedAtom, ["non-existent"]);

			const modified = store.get(manuscriptModifiedScenesAtom);
			expect(modified.has("scene-1")).toBe(true);
			expect(modified.has("scene-2")).toBe(true);
		});

		it("保存マーク時に他の状態を維持する", () => {
			store.set(markScenesSavedAtom, ["scene-1"]);

			expect(store.get(isManuscriptModeAtom)).toBe(true);
			expect(store.get(manuscriptChapterIdAtom)).toBe("chapter-1");
			expect(store.get(manuscriptScenesAtom)).toEqual([mockScene1, mockScene2]);
		});
	});
});
