import type { WorkOutline } from "@shared/types";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleChapterReorder } from "./handle-chapter-reorder";

const mockUpdateChapterSortOrder = vi.fn();

vi.mock("../../editor", () => ({
	updateChapterSortOrder: (...args: unknown[]) =>
		mockUpdateChapterSortOrder(...args),
}));

describe("handleChapterReorder", () => {
	let mockSetNodes: Mock<(nodes: WorkOutline) => void>;
	let mockReload: Mock<() => void>;

	const createTestNodes = (
		chapters: { id: string; sort_order: number; is_deleted?: boolean }[],
	): WorkOutline => ({
		chapters: chapters.map((ch) => ({
			id: ch.id,
			title: `Chapter ${ch.id}`,
			sort_order: ch.sort_order,
			is_deleted: ch.is_deleted ?? false,
			word_count: 0,
		})),
		scenes: [],
	});

	beforeEach(() => {
		mockSetNodes = vi.fn();
		mockReload = vi.fn();
		mockUpdateChapterSortOrder.mockResolvedValue({ ok: true });
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("チャプターを上に移動できる", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
				{ id: "3", sort_order: 2 },
			]);

			await handleChapterReorder("3", "1", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const sortedChapters = [...updatedNodes.chapters].sort(
				(a, b) => a.sort_order - b.sort_order,
			);
			expect(sortedChapters.map((c) => c.id)).toEqual(["3", "1", "2"]);
		});

		it("チャプターを下に移動できる", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
				{ id: "3", sort_order: 2 },
			]);

			await handleChapterReorder("1", "3", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).toHaveBeenCalledTimes(1);
			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const sortedChapters = [...updatedNodes.chapters].sort(
				(a, b) => a.sort_order - b.sort_order,
			);
			expect(sortedChapters.map((c) => c.id)).toEqual(["2", "3", "1"]);
		});

		it("IPCで正しい引数が渡される", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
			]);

			await handleChapterReorder("2", "1", nodes, mockSetNodes, mockReload);

			expect(mockUpdateChapterSortOrder).toHaveBeenCalledWith("2", 0);
			expect(mockUpdateChapterSortOrder).toHaveBeenCalledWith("1", 1);
		});

		it("削除済みチャプターは並び替え対象外", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1, is_deleted: true },
				{ id: "3", sort_order: 2 },
			]);

			await handleChapterReorder("3", "1", nodes, mockSetNodes, mockReload);

			const updatedNodes = mockSetNodes.mock.calls[0][0] as WorkOutline;

			const deletedChapter = updatedNodes.chapters.find((c) => c.id === "2");
			expect(deletedChapter?.is_deleted).toBe(true);

			const visibleChapters = updatedNodes.chapters
				.filter((c) => !c.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order);
			expect(visibleChapters.map((c) => c.id)).toEqual(["3", "1"]);
		});
	});

	describe("異常系", () => {
		it("存在しないactiveChapterIdの場合は何もしない", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
			]);

			await handleChapterReorder("999", "1", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockUpdateChapterSortOrder).not.toHaveBeenCalled();
		});

		it("存在しないoverChapterIdの場合は何もしない", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
			]);

			await handleChapterReorder("1", "999", nodes, mockSetNodes, mockReload);

			expect(mockSetNodes).not.toHaveBeenCalled();
			expect(mockUpdateChapterSortOrder).not.toHaveBeenCalled();
		});

		it("バックエンド更新失敗時はreloadが呼ばれる", async () => {
			mockUpdateChapterSortOrder.mockResolvedValue({ ok: false });

			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
			]);

			await handleChapterReorder("2", "1", nodes, mockSetNodes, mockReload);

			expect(mockReload).toHaveBeenCalledTimes(1);
		});
	});

	describe("最適化", () => {
		it("sort_orderが変わらないチャプターはIPC呼び出ししない", async () => {
			const nodes = createTestNodes([
				{ id: "1", sort_order: 0 },
				{ id: "2", sort_order: 1 },
				{ id: "3", sort_order: 2 },
			]);

			await handleChapterReorder("3", "2", nodes, mockSetNodes, mockReload);

			expect(mockUpdateChapterSortOrder).not.toHaveBeenCalledWith("1", 0);

			expect(mockUpdateChapterSortOrder).toHaveBeenCalledWith("3", 1);
			expect(mockUpdateChapterSortOrder).toHaveBeenCalledWith("2", 2);
		});
	});
});
