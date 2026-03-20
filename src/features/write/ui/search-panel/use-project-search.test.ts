import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestWrapper } from "@/test/utils";
import { editorJumpTargetAtom } from "../../model/search/store";
import type {
	ProjectSearchResult,
	SearchMatch,
} from "../../model/search/types";

const mockSearchProject = vi.fn();
const mockReplaceInProject = vi.fn();

vi.mock("../../model/search/commands", () => ({
	searchProject: (...args: unknown[]) => mockSearchProject(...args),
	replaceInProject: (...args: unknown[]) => mockReplaceInProject(...args),
}));

const mockShowConfirmDialog = vi.fn();
vi.mock("@shared/lib/dialog", () => ({
	showConfirmDialog: (...args: unknown[]) => mockShowConfirmDialog(...args),
}));

const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();
vi.mock("@shared/lib/toast", () => ({
	useToast: () => ({
		showError: mockShowError,
		showSuccess: mockShowSuccess,
	}),
}));

const mockFlushAll = vi.fn().mockResolvedValue(false);
vi.mock("@shared/hooks/pending-saves-registry", () => ({
	pendingSavesRegistry: {
		flushAll: () => mockFlushAll(),
	},
}));

vi.mock("@features/work", () => {
	const { atom } = require("jotai");
	return {
		selectedWorkAtom: atom({ id: "work-1", name: "テスト作品" }),
		selectedNodeAtom: atom(null as { id: string; type: string } | null),
	};
});

vi.mock("../../model/editor/store", () => {
	const { atom } = require("jotai");
	return {
		reloadSceneContentAtom: atom(null, vi.fn()),
	};
});

import { useProjectSearch } from "./use-project-search";

const createMatch = (overrides: Partial<SearchMatch> = {}): SearchMatch => ({
	sceneId: "s1",
	sceneTitle: "シーン1",
	chapterId: "c1",
	chapterTitle: "第1章",
	lineNumber: 1,
	lineText: "テスト行",
	matchStart: 0,
	matchEnd: 3,
	charOffset: 0,
	...overrides,
});

const createSearchResult = (count: number): ProjectSearchResult => ({
	totalMatches: count,
	totalScenes: 1,
	matches: Array.from({ length: count }, (_, i) =>
		createMatch({ charOffset: i * 10 }),
	),
});

describe("useProjectSearch", () => {
	let wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];
	let store: ReturnType<typeof createTestWrapper>["store"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		wrapper = testWrapper.Wrapper;
		store = testWrapper.store;
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("初期状態", () => {
		it("初期値が正しい", () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			expect(result.current.query).toBe("");
			expect(result.current.caseSensitive).toBe(false);
			expect(result.current.replaceText).toBe("");
			expect(result.current.searchResult).toBeNull();
			expect(result.current.selectedIndex).toBe(-1);
		});
	});

	describe("検索実行", () => {
		it("クエリ入力後 300ms で検索が実行される", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
			});

			await act(async () => {
				vi.advanceTimersByTime(299);
			});
			expect(mockSearchProject).not.toHaveBeenCalled();

			await act(async () => {
				vi.advanceTimersByTime(1);
			});
			expect(mockSearchProject).toHaveBeenCalledWith("work-1", "テスト", false);
		});

		it("検索前に未保存の変更をフラッシュする", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
			});

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			expect(mockFlushAll).toHaveBeenCalled();
			expect(mockSearchProject).toHaveBeenCalled();
		});

		it("空クエリでは検索しない", async () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("   ");
			});

			await act(async () => {
				vi.advanceTimersByTime(300);
			});
			expect(mockSearchProject).not.toHaveBeenCalled();
		});

		it("検索成功時に結果が設定される", async () => {
			const searchResult = createSearchResult(3);
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: searchResult,
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
			});

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			expect(result.current.searchResult).toEqual(searchResult);
			expect(result.current.selectedIndex).toBe(-1);
		});

		it("検索失敗時にエラートーストが表示される", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "失敗" },
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
			});

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			expect(mockShowError).toHaveBeenCalledWith("検索に失敗しました");
			expect(result.current.searchResult).toBeNull();
		});

		it("caseSensitive が検索パラメータに反映される", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setCaseSensitive(true);
				result.current.setQuery("テスト");
			});

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			expect(mockSearchProject).toHaveBeenCalledWith("work-1", "テスト", true);
		});

		it("連続入力時は最後のクエリのみ検索される（debounce）", async () => {
			mockSearchProject.mockResolvedValue({
				ok: true,
				value: createSearchResult(1),
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テ");
			});
			await act(async () => {
				vi.advanceTimersByTime(100);
			});

			act(() => {
				result.current.setQuery("テス");
			});
			await act(async () => {
				vi.advanceTimersByTime(100);
			});

			act(() => {
				result.current.setQuery("テスト");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			expect(mockSearchProject).toHaveBeenCalledTimes(1);
			expect(mockSearchProject).toHaveBeenCalledWith("work-1", "テスト", false);
		});
	});

	describe("handleClose", () => {
		it("パネルを閉じて状態をリセットする", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
				result.current.setReplaceText("置換");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			act(() => {
				result.current.handleClose();
			});

			expect(result.current.query).toBe("");
			expect(result.current.replaceText).toBe("");
			expect(result.current.searchResult).toBeNull();
			expect(result.current.selectedIndex).toBe(-1);
		});
	});

	describe("handleMatchClick", () => {
		it("マッチをクリックすると選択インデックスが更新される", () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });
			const match = createMatch({ sceneId: "s1", charOffset: 42 });

			act(() => {
				result.current.handleMatchClick(match, 2);
			});

			expect(result.current.selectedIndex).toBe(2);
		});

		it("マッチをクリックするとジャンプターゲットが設定される", () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });
			const match = createMatch({
				sceneId: "s2",
				charOffset: 42,
				matchStart: 5,
				matchEnd: 8,
			});

			act(() => {
				result.current.handleMatchClick(match, 0);
			});

			const jumpTarget = store.get(editorJumpTargetAtom);
			expect(jumpTarget).toEqual({
				sceneId: "s2",
				charOffset: 42,
				length: 3,
			});
		});
	});

	describe("handleReplaceAll", () => {
		it("確認ダイアログで承認後に置換を実行する", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(3),
			});
			mockShowConfirmDialog.mockResolvedValueOnce(true);
			mockReplaceInProject.mockResolvedValueOnce({
				ok: true,
				value: { replacedCount: 3, affectedScenes: 1 },
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
				result.current.setReplaceText("置換後");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			await act(async () => {
				await result.current.handleReplaceAll();
			});

			expect(mockShowConfirmDialog).toHaveBeenCalledWith(
				"3件を「置換後」に置換しますか？",
				{ title: "一括置換", kind: "warning" },
			);
			expect(mockReplaceInProject).toHaveBeenCalledWith(
				"work-1",
				"テスト",
				"置換後",
				false,
			);
			expect(mockShowSuccess).toHaveBeenCalledWith(
				"3件を1シーンで置換しました",
			);

			expect(result.current.query).toBe("");
			expect(result.current.replaceText).toBe("");
			expect(result.current.searchResult).toBeNull();
			expect(result.current.selectedIndex).toBe(-1);
		});

		it("置換前に未保存の変更をフラッシュする", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});
			mockShowConfirmDialog.mockResolvedValueOnce(true);
			mockReplaceInProject.mockResolvedValueOnce({
				ok: true,
				value: { replacedCount: 1, affectedScenes: 1 },
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
				result.current.setReplaceText("置換後");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			mockFlushAll.mockClear();

			await act(async () => {
				await result.current.handleReplaceAll();
			});

			expect(mockFlushAll).toHaveBeenCalled();
		});

		it("確認ダイアログでキャンセルすると置換しない", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});
			mockShowConfirmDialog.mockResolvedValueOnce(false);

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
				result.current.setReplaceText("置換後");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			await act(async () => {
				await result.current.handleReplaceAll();
			});

			expect(mockReplaceInProject).not.toHaveBeenCalled();
		});

		it("置換失敗時にエラートーストが表示される", async () => {
			mockSearchProject.mockResolvedValueOnce({
				ok: true,
				value: createSearchResult(1),
			});
			mockShowConfirmDialog.mockResolvedValueOnce(true);
			mockReplaceInProject.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "失敗" },
			});

			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.setQuery("テスト");
				result.current.setReplaceText("置換後");
			});
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			await act(async () => {
				await result.current.handleReplaceAll();
			});

			expect(mockShowError).toHaveBeenCalledWith("置換に失敗しました");
		});

		it("検索結果がない場合は何もしない", async () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			await act(async () => {
				await result.current.handleReplaceAll();
			});

			expect(mockShowConfirmDialog).not.toHaveBeenCalled();
			expect(mockReplaceInProject).not.toHaveBeenCalled();
		});
	});

	describe("handleKeyDown", () => {
		const createKeyEvent = (
			key: string,
			shiftKey = false,
		): React.KeyboardEvent =>
			({
				key,
				shiftKey,
				preventDefault: vi.fn(),
			}) as unknown as React.KeyboardEvent;

		it("Escape でパネルを閉じる", () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.handleKeyDown(createKeyEvent("Escape"));
			});

			expect(result.current.query).toBe("");
			expect(result.current.searchResult).toBeNull();
		});

		it("Enter では何もしない", () => {
			const { result } = renderHook(() => useProjectSearch(), { wrapper });

			act(() => {
				result.current.handleKeyDown(createKeyEvent("Enter"));
			});

			expect(result.current.selectedIndex).toBe(-1);
		});
	});
});
