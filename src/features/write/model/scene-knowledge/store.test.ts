import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./commands", () => ({
	getSceneKnowledge: vi.fn(),
	linkKnowledgeToScene: vi.fn(),
	unlinkKnowledgeFromScene: vi.fn(),
}));

import {
	getSceneKnowledge,
	linkKnowledgeToScene,
	unlinkKnowledgeFromScene,
} from "./commands";
import {
	linkKnowledgeAtom,
	loadSceneKnowledgeAtom,
	sceneKnowledgeAtom,
	unlinkKnowledgeAtom,
} from "./store";

const mockGetSceneKnowledge = vi.mocked(getSceneKnowledge);
const mockLinkKnowledgeToScene = vi.mocked(linkKnowledgeToScene);
const mockUnlinkKnowledgeFromScene = vi.mocked(unlinkKnowledgeFromScene);

const mockKnowledge1 = {
	id: "knowledge-1",
	work_id: "work-1",
	type_id: "type-1",
	title: "Knowledge 1",
	sort_order: 0,
};

const mockKnowledge2 = {
	id: "knowledge-2",
	work_id: "work-1",
	type_id: "type-2",
	title: "Knowledge 2",
	sort_order: 1,
};

describe("scene-knowledge store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();
	});

	describe("sceneKnowledgeAtom", () => {
		it("デフォルト値は空配列", () => {
			expect(store.get(sceneKnowledgeAtom)).toEqual([]);
		});
	});

	describe("loadSceneKnowledgeAtom", () => {
		it("シーンのナレッジを読み込める", async () => {
			mockGetSceneKnowledge.mockResolvedValue({
				ok: true,
				value: [mockKnowledge1, mockKnowledge2],
			});

			await store.set(loadSceneKnowledgeAtom, "scene-1");

			expect(store.get(sceneKnowledgeAtom)).toEqual([
				mockKnowledge1,
				mockKnowledge2,
			]);
			expect(mockGetSceneKnowledge).toHaveBeenCalledWith("scene-1");
		});

		it("sceneId が null の場合はナレッジをクリアする", async () => {
			store.set(sceneKnowledgeAtom, [mockKnowledge1]);

			await store.set(loadSceneKnowledgeAtom, null);

			expect(store.get(sceneKnowledgeAtom)).toEqual([]);
			expect(mockGetSceneKnowledge).not.toHaveBeenCalled();
		});

		it("失敗時は現在のナレッジを維持する", async () => {
			store.set(sceneKnowledgeAtom, [mockKnowledge1]);
			mockGetSceneKnowledge.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSceneKnowledgeAtom, "scene-1");

			expect(store.get(sceneKnowledgeAtom)).toEqual([mockKnowledge1]);
		});
	});

	describe("linkKnowledgeAtom", () => {
		it("シーンにナレッジを紐付ける", async () => {
			mockLinkKnowledgeToScene.mockResolvedValue({
				ok: true,
				value: "link-id-1",
			});

			const result = await store.set(linkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledge: mockKnowledge1,
			});

			expect(result).toBe(true);
			expect(store.get(sceneKnowledgeAtom)).toEqual([mockKnowledge1]);
			expect(mockLinkKnowledgeToScene).toHaveBeenCalledWith(
				"scene-1",
				"knowledge-1",
			);
		});

		it("重複するナレッジは追加しない", async () => {
			store.set(sceneKnowledgeAtom, [mockKnowledge1]);
			mockLinkKnowledgeToScene.mockResolvedValue({
				ok: true,
				value: "link-id-1",
			});

			await store.set(linkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledge: mockKnowledge1,
			});

			expect(store.get(sceneKnowledgeAtom)).toEqual([mockKnowledge1]);
		});

		it("異なるナレッジは追加できる", async () => {
			store.set(sceneKnowledgeAtom, [mockKnowledge1]);
			mockLinkKnowledgeToScene.mockResolvedValue({
				ok: true,
				value: "link-id-2",
			});

			await store.set(linkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledge: mockKnowledge2,
			});

			expect(store.get(sceneKnowledgeAtom)).toEqual([
				mockKnowledge1,
				mockKnowledge2,
			]);
		});

		it("失敗時は false を返す", async () => {
			mockLinkKnowledgeToScene.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(linkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledge: mockKnowledge1,
			});

			expect(result).toBe(false);
			expect(store.get(sceneKnowledgeAtom)).toEqual([]);
		});
	});

	describe("unlinkKnowledgeAtom", () => {
		beforeEach(() => {
			store.set(sceneKnowledgeAtom, [mockKnowledge1, mockKnowledge2]);
		});

		it("シーンからナレッジの紐付けを解除する", async () => {
			mockUnlinkKnowledgeFromScene.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(unlinkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledgeId: "knowledge-1",
			});

			expect(result).toBe(true);
			expect(store.get(sceneKnowledgeAtom)).toEqual([mockKnowledge2]);
			expect(mockUnlinkKnowledgeFromScene).toHaveBeenCalledWith(
				"scene-1",
				"knowledge-1",
			);
		});

		it("失敗時は false を返す", async () => {
			mockUnlinkKnowledgeFromScene.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(unlinkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledgeId: "knowledge-1",
			});

			expect(result).toBe(false);
			expect(store.get(sceneKnowledgeAtom)).toEqual([
				mockKnowledge1,
				mockKnowledge2,
			]);
		});

		it("存在しないナレッジの紐付け解除を適切に処理する", async () => {
			mockUnlinkKnowledgeFromScene.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			await store.set(unlinkKnowledgeAtom, {
				sceneId: "scene-1",
				knowledgeId: "non-existent",
			});

			expect(store.get(sceneKnowledgeAtom)).toEqual([
				mockKnowledge1,
				mockKnowledge2,
			]);
		});
	});
});
