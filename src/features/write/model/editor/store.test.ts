import type { Editor } from "@tiptap/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestWrapper } from "@/test/utils";
import {
	editorCommandsAtom,
	editorInstanceAtom,
	loadSelectedSceneAtom,
	selectedSceneAtom,
	updateSelectedSceneAtom,
} from "./store";
import type { Scene } from "./types";

vi.mock("./commands", () => ({
	getScene: vi.fn(),
}));

import { getScene } from "./commands";

const mockGetScene = vi.mocked(getScene);

describe("editor/store", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	const createMockScene = (overrides: Partial<Scene> = {}): Scene => ({
		id: "scene-1",
		chapter_id: "chapter-1",
		title: "テストシーン",
		synopsis: "テストシーンの概要",
		content_text: "本文テキスト",
		content_markups: "[]",
		word_count: 10,
		sort_order: 0,
		is_deleted: false,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		...overrides,
	});

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		vi.clearAllMocks();
	});

	describe("editorInstanceAtom", () => {
		it("初期値は null", () => {
			const editor = store.get(editorInstanceAtom);
			expect(editor).toBeNull();
		});

		it("エディタインスタンスを設定できる", () => {
			const mockEditor = {
				commands: {
					undo: vi.fn(),
					redo: vi.fn(),
					focus: vi.fn(),
				},
			} as unknown as Editor;

			store.set(editorInstanceAtom, mockEditor);
			const editor = store.get(editorInstanceAtom);

			expect(editor).toBe(mockEditor);
		});
	});

	describe("editorCommandsAtom", () => {
		it("エディタがない場合は何もしない", () => {
			store.set(editorInstanceAtom, null);
			const commands = store.get(editorCommandsAtom);

			expect(commands.undo()).toBeUndefined();
			expect(commands.redo()).toBeUndefined();
			expect(commands.focus()).toBeUndefined();
			expect(commands.selectAll()).toBeUndefined();
		});

		it("エディタがある場合はコマンドを実行", () => {
			const mockUndo = vi.fn().mockReturnValue(true);
			const mockRedo = vi.fn().mockReturnValue(true);
			const mockFocus = vi.fn().mockReturnValue(true);
			const mockSelectAll = vi.fn().mockReturnValue(true);

			const mockEditor = {
				commands: {
					undo: mockUndo,
					redo: mockRedo,
					focus: mockFocus,
					selectAll: mockSelectAll,
				},
				state: {
					selection: { from: 0, to: 0 },
					doc: { textBetween: vi.fn().mockReturnValue("") },
				},
			} as unknown as Editor;

			store.set(editorInstanceAtom, mockEditor);
			const commands = store.get(editorCommandsAtom);

			commands.undo();
			expect(mockUndo).toHaveBeenCalled();

			commands.redo();
			expect(mockRedo).toHaveBeenCalled();

			commands.focus();
			expect(mockFocus).toHaveBeenCalled();

			commands.selectAll();
			expect(mockSelectAll).toHaveBeenCalled();
		});
	});

	describe("selectedSceneAtom", () => {
		it("初期値は null", () => {
			const scene = store.get(selectedSceneAtom);
			expect(scene).toBeNull();
		});

		it("シーンを設定できる", () => {
			const mockScene = createMockScene();
			store.set(selectedSceneAtom, mockScene);

			const scene = store.get(selectedSceneAtom);
			expect(scene).toEqual(mockScene);
		});

		it("null にリセットできる", () => {
			const mockScene = createMockScene();
			store.set(selectedSceneAtom, mockScene);
			store.set(selectedSceneAtom, null);

			const scene = store.get(selectedSceneAtom);
			expect(scene).toBeNull();
		});
	});

	describe("loadSelectedSceneAtom", () => {
		it("sceneId が null の場合は selectedScene を null にする", async () => {
			store.set(selectedSceneAtom, createMockScene());

			await store.set(loadSelectedSceneAtom, null);

			const scene = store.get(selectedSceneAtom);
			expect(scene).toBeNull();
			expect(mockGetScene).not.toHaveBeenCalled();
		});

		it("sceneId がある場合はシーンを読み込む", async () => {
			const mockScene = createMockScene({ id: "scene-123" });
			mockGetScene.mockResolvedValueOnce({ ok: true, value: mockScene });

			await store.set(loadSelectedSceneAtom, "scene-123");

			const scene = store.get(selectedSceneAtom);
			expect(scene).toEqual(mockScene);
			expect(mockGetScene).toHaveBeenCalledWith("scene-123");
		});

		it("読み込み失敗時はシーンを更新しない", async () => {
			const existingScene = createMockScene({ id: "existing" });
			store.set(selectedSceneAtom, existingScene);
			mockGetScene.mockResolvedValueOnce({
				ok: false,
				error: { code: "NOT_FOUND", message: "Scene not found" },
			});

			await store.set(loadSelectedSceneAtom, "invalid-id");

			const scene = store.get(selectedSceneAtom);
			expect(scene).toEqual(existingScene);
		});
	});

	describe("updateSelectedSceneAtom", () => {
		it("選択中のシーンがない場合は何もしない", () => {
			store.set(selectedSceneAtom, null);

			store.set(updateSelectedSceneAtom, { title: "新しいタイトル" });

			const scene = store.get(selectedSceneAtom);
			expect(scene).toBeNull();
		});

		it("選択中のシーンを部分更新できる", () => {
			const originalScene = createMockScene({
				id: "scene-1",
				title: "元のタイトル",
				content_text: "元の本文",
			});
			store.set(selectedSceneAtom, originalScene);

			store.set(updateSelectedSceneAtom, { title: "更新されたタイトル" });

			const scene = store.get(selectedSceneAtom);
			expect(scene?.title).toBe("更新されたタイトル");
			expect(scene?.content_text).toBe("元の本文");
			expect(scene?.id).toBe("scene-1");
		});

		it("複数フィールドを同時に更新できる", () => {
			const originalScene = createMockScene();
			store.set(selectedSceneAtom, originalScene);

			store.set(updateSelectedSceneAtom, {
				title: "新タイトル",
				content_text: "新本文",
				word_count: 100,
			});

			const scene = store.get(selectedSceneAtom);
			expect(scene?.title).toBe("新タイトル");
			expect(scene?.content_text).toBe("新本文");
			expect(scene?.word_count).toBe(100);
		});

		it("updated_at を更新できる", () => {
			const originalScene = createMockScene({
				updated_at: "2024-01-01T00:00:00Z",
			});
			store.set(selectedSceneAtom, originalScene);

			const newUpdatedAt = "2024-01-15T12:00:00Z";
			store.set(updateSelectedSceneAtom, { updated_at: newUpdatedAt });

			const scene = store.get(selectedSceneAtom);
			expect(scene?.updated_at).toBe(newUpdatedAt);
		});
	});
});
