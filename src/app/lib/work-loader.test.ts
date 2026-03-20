import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadWorkData } from "./work-loader";

const mockGetWorkOutline = vi.fn();
const mockGetSelectedNode = vi.fn();
const mockGetExpandedChapters = vi.fn();
const mockGetKnowledgeByWork = vi.fn();
const mockGetKnowledgeTypesByWork = vi.fn();
const mockGetWorkStatistics = vi.fn();

vi.mock("@features/write/model/outline/commands", () => ({
	getWorkOutline: (...args: unknown[]) => mockGetWorkOutline(...args),
	getWorkStatistics: (...args: unknown[]) => mockGetWorkStatistics(...args),
}));

vi.mock("@features/knowledge", () => ({
	getKnowledgeByWork: (...args: unknown[]) => mockGetKnowledgeByWork(...args),
	getKnowledgeTypesByWork: (...args: unknown[]) =>
		mockGetKnowledgeTypesByWork(...args),
}));

vi.mock("@features/work/model/commands", () => ({
	getSelectedNode: (...args: unknown[]) => mockGetSelectedNode(...args),
	getExpandedChapters: (...args: unknown[]) => mockGetExpandedChapters(...args),
}));

vi.mock("@shared/lib", () => ({
	unwrapOr: (result: { ok: boolean; value: unknown }, defaultValue: unknown) =>
		result.ok ? result.value : defaultValue,
}));

describe("loadWorkData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetWorkOutline.mockResolvedValue({
			ok: true,
			value: {
				chapters: [{ id: 1, title: "Chapter 1" }],
				scenes: [
					{ id: 1, chapter_id: 1, title: "Scene 1" },
					{ id: 2, chapter_id: 1, title: "Scene 2" },
				],
			},
		});
		mockGetSelectedNode.mockResolvedValue({ ok: true, value: null });
		mockGetExpandedChapters.mockResolvedValue({ ok: true, value: {} });
		mockGetKnowledgeByWork.mockResolvedValue({ ok: true, value: [] });
		mockGetKnowledgeTypesByWork.mockResolvedValue({ ok: true, value: [] });
		mockGetWorkStatistics.mockResolvedValue({
			ok: true,
			value: { total_word_count: 0, scene_count: 0, chapter_count: 0 },
		});
	});

	describe("正常系", () => {
		it("保存されたselectedNodeがある場合はそれを返す", async () => {
			mockGetSelectedNode.mockResolvedValue({
				ok: true,
				value: { id: 2, type: "scene" },
			});

			const result = await loadWorkData("1");

			expect(result.selectedNode).toEqual({ id: 2, type: "scene" });
		});

		it("保存されたexpandedChaptersを返す", async () => {
			mockGetExpandedChapters.mockResolvedValue({
				ok: true,
				value: { 1: true, 2: false },
			});
			mockGetSelectedNode.mockResolvedValue({
				ok: true,
				value: { id: 1, type: "chapter" },
			});

			const result = await loadWorkData("1");

			expect(result.expandedChapters[1]).toBe(true);
			expect(result.expandedChapters[2]).toBe(false);
		});

		it("outlineを正しく取得できる", async () => {
			const result = await loadWorkData("1");

			expect(result.outline.chapters).toHaveLength(1);
			expect(result.outline.scenes).toHaveLength(2);
		});

		it("正しいworkIdでAPIが呼ばれる", async () => {
			await loadWorkData("42");

			expect(mockGetWorkOutline).toHaveBeenCalledWith("42");
			expect(mockGetSelectedNode).toHaveBeenCalledWith("42");
			expect(mockGetExpandedChapters).toHaveBeenCalledWith("42");
		});
	});

	describe("selectedNodeがnullの場合のフォールバック", () => {
		it("最初のシーンを自動選択する", async () => {
			const result = await loadWorkData("1");

			expect(result.selectedNode).toEqual({ id: 1, type: "scene" });
		});

		it("シーンが存在しない場合はnullのまま", async () => {
			mockGetWorkOutline.mockResolvedValue({
				ok: true,
				value: { chapters: [], scenes: [] },
			});

			const result = await loadWorkData("1");

			expect(result.selectedNode).toBeNull();
		});
	});

	describe("親チャプターの自動展開", () => {
		it("最初のシーン選択時に親チャプターが展開される", async () => {
			const result = await loadWorkData("1");

			expect(result.expandedChapters[1]).toBe(true);
		});

		it("保存されたシーン選択時に親チャプターが展開される", async () => {
			mockGetSelectedNode.mockResolvedValue({
				ok: true,
				value: { id: 2, type: "scene" },
			});

			const result = await loadWorkData("1");

			expect(result.expandedChapters[1]).toBe(true);
		});

		it("チャプター選択時は展開状態を変更しない", async () => {
			mockGetSelectedNode.mockResolvedValue({
				ok: true,
				value: { id: 1, type: "chapter" },
			});

			const result = await loadWorkData("1");

			expect(result.expandedChapters).toEqual({});
		});
	});

	describe("エラーハンドリング", () => {
		it("outline取得失敗時は空のoutlineを返す", async () => {
			mockGetWorkOutline.mockResolvedValue({ ok: false });

			const result = await loadWorkData("1");

			expect(result.outline).toEqual({ chapters: [], scenes: [] });
		});

		it("selectedNode取得失敗時はnullを返す", async () => {
			mockGetSelectedNode.mockResolvedValue({ ok: false });
			mockGetWorkOutline.mockResolvedValue({
				ok: true,
				value: { chapters: [], scenes: [] },
			});

			const result = await loadWorkData("1");

			expect(result.selectedNode).toBeNull();
		});

		it("expandedChapters取得失敗時は空オブジェクトを返す", async () => {
			mockGetExpandedChapters.mockResolvedValue({ ok: false });
			mockGetSelectedNode.mockResolvedValue({
				ok: true,
				value: { id: 1, type: "chapter" },
			});

			const result = await loadWorkData("1");

			expect(result.expandedChapters).toEqual({});
		});
	});
});
