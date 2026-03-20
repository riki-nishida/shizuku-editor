import type { WorkOutline } from "@shared/types";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleSceneReorder } from "./handle-scene-reorder";

const mockUpdateSceneSortOrder = vi.fn();
const mockMoveSceneToChapter = vi.fn();

vi.mock("../../editor", () => ({
	updateSceneSortOrder: (...args: unknown[]) =>
		mockUpdateSceneSortOrder(...args),
	moveSceneToChapter: (...args: unknown[]) => mockMoveSceneToChapter(...args),
}));

describe("handleSceneReorder", () => {
	let mockSetNodes: Mock<(nodes: WorkOutline) => void>;
	let mockReload: Mock<() => void>;

	const createTestNodes = (
		chapters: { id: string }[],
		scenes: {
			id: string;
			chapter_id: string;
			sort_order: number;
			is_deleted?: boolean;
		}[],
	): WorkOutline => ({
		chapters: chapters.map((ch) => ({
			id: ch.id,
			title: `Chapter ${ch.id}`,
			sort_order: 0,
			is_deleted: false,
			word_count: 0,
		})),
		scenes: scenes.map((sc) => ({
			id: sc.id,
			chapter_id: sc.chapter_id,
			title: `Scene ${sc.id}`,
			sort_order: sc.sort_order,
			is_deleted: sc.is_deleted ?? false,
			word_count: 0,
		})),
	});

	beforeEach(() => {
		mockSetNodes = vi.fn();
		mockReload = vi.fn();
		mockUpdateSceneSortOrder.mockResolvedValue({ ok: true });
		mockMoveSceneToChapter.mockResolvedValue({ ok: true });
		vi.clearAllMocks();
	});

	describe("同一チャプター内での並び替え", () => {
		it("シーンを上に移動できる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
					{ id: "3", chapter_id: "1", sort_order: 2 },
				],
			);

			await handleSceneReorder("3", "1", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const sortedScenes = [...updatedNodes.scenes].sort(
				(a, b) => a.sort_order - b.sort_order,
			);
			expect(sortedScenes.map((s) => s.id)).toEqual(["3", "1", "2"]);
		});

		it("シーンを下に移動できる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
					{ id: "3", chapter_id: "1", sort_order: 2 },
				],
			);

			await handleSceneReorder("1", "3", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const sortedScenes = [...updatedNodes.scenes].sort(
				(a, b) => a.sort_order - b.sort_order,
			);
			expect(sortedScenes.map((s) => s.id)).toEqual(["2", "3", "1"]);
		});

		it("updateSceneSortOrderが正しい引数で呼ばれる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
				],
			);

			await handleSceneReorder("2", "1", nodes, mockSetNodes, mockReload);

			expect(mockUpdateSceneSortOrder).toHaveBeenCalledWith("2", 0);
			expect(mockUpdateSceneSortOrder).toHaveBeenCalledWith("1", 1);
		});
	});

	describe("異なるチャプター間での移動", () => {
		it("シーンを別チャプターに移動できる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
					{ id: "3", chapter_id: "2", sort_order: 0 },
				],
			);

			await handleSceneReorder("1", "3", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const movedScene = updatedNodes.scenes.find((s) => s.id === "1");
			expect(movedScene?.chapter_id).toBe("2");
		});

		it("moveSceneToChapterが正しい引数で呼ばれる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "3", chapter_id: "2", sort_order: 0 },
				],
			);

			await handleSceneReorder("1", "3", nodes, mockSetNodes, mockReload);

			expect(mockMoveSceneToChapter).toHaveBeenCalledWith("1", "2", 0);
		});
	});

	describe("異常系", () => {
		it("存在しないactiveSceneIdの場合は何もしない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneReorder("999", "1", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockUpdateSceneSortOrder).not.toHaveBeenCalled();
		});

		it("存在しないoverSceneIdの場合は何もしない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneReorder("1", "999", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockUpdateSceneSortOrder).not.toHaveBeenCalled();
		});

		it("バックエンド更新失敗時はreloadが呼ばれる", async () => {
			mockUpdateSceneSortOrder.mockResolvedValue({ ok: false });

			const nodes = createTestNodes(
				[{ id: "1" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
				],
			);

			await handleSceneReorder("2", "1", nodes, mockSetNodes, mockReload);

			expect(mockReload).toHaveBeenCalledTimes(1);
		});
	});

	describe("最適化", () => {
		it("sort_orderが変わらないシーンはIPC呼び出ししない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "1", sort_order: 1 },
					{ id: "3", chapter_id: "1", sort_order: 2 },
				],
			);

			await handleSceneReorder("3", "2", nodes, mockSetNodes, mockReload);

			expect(mockUpdateSceneSortOrder).not.toHaveBeenCalledWith("1", 0);
			expect(mockUpdateSceneSortOrder).toHaveBeenCalledWith("3", 1);
			expect(mockUpdateSceneSortOrder).toHaveBeenCalledWith("2", 2);
		});
	});
});
