import type { WorkOutline } from "@shared/types";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleSceneToChapterDrop } from "./handle-scene-to-chapter-drop";

const mockMoveSceneToChapter = vi.fn();

vi.mock("../../editor", () => ({
	moveSceneToChapter: (...args: unknown[]) => mockMoveSceneToChapter(...args),
}));

describe("handleSceneToChapterDrop", () => {
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
		mockMoveSceneToChapter.mockResolvedValue({ ok: true });
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("シーンを別チャプターの末尾に移動できる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "2", sort_order: 0 },
					{ id: "3", chapter_id: "2", sort_order: 1 },
				],
			);

			await handleSceneToChapterDrop("1", "2", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const movedScene = updatedNodes.scenes.find((s) => s.id === "1");
			expect(movedScene?.chapter_id).toBe("2");

			expect(movedScene?.sort_order).toBe(2);
		});

		it("空のチャプターにシーンを移動できる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneToChapterDrop("1", "2", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const movedScene = updatedNodes.scenes.find((s) => s.id === "1");
			expect(movedScene?.chapter_id).toBe("2");
			expect(movedScene?.sort_order).toBe(0);
		});

		it("moveSceneToChapterが正しい引数で呼ばれる", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "2", sort_order: 0 },
				],
			);

			await handleSceneToChapterDrop("1", "2", nodes, mockSetNodes, mockReload);

			expect(mockMoveSceneToChapter).toHaveBeenCalledWith("1", "2", 1);
		});
	});

	describe("異常系", () => {
		it("存在しないシーンIDの場合は何もしない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneToChapterDrop(
				"999",
				"1",
				nodes,
				mockSetNodes,
				mockReload,
			);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockMoveSceneToChapter).not.toHaveBeenCalled();
		});

		it("同じチャプターへのドロップは何もしない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneToChapterDrop("1", "1", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockMoveSceneToChapter).not.toHaveBeenCalled();
		});

		it("バックエンド更新失敗時はreloadが呼ばれる", async () => {
			mockMoveSceneToChapter.mockRejectedValue(new Error("API Error"));

			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[{ id: "1", chapter_id: "1", sort_order: 0 }],
			);

			await handleSceneToChapterDrop("1", "2", nodes, mockSetNodes, mockReload);

			expect(mockReload).toHaveBeenCalledTimes(1);
		});
	});

	describe("削除済みシーンの扱い", () => {
		it("削除済みシーンはsort_order計算に含まれない", async () => {
			const nodes = createTestNodes(
				[{ id: "1" }, { id: "2" }],
				[
					{ id: "1", chapter_id: "1", sort_order: 0 },
					{ id: "2", chapter_id: "2", sort_order: 0 },
					{ id: "3", chapter_id: "2", sort_order: 1, is_deleted: true },
				],
			);

			await handleSceneToChapterDrop("1", "2", nodes, mockSetNodes, mockReload);

			expect(mockMoveSceneToChapter).toHaveBeenCalledWith("1", "2", 1);
		});
	});
});
