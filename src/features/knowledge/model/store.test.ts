import type {
	KnowledgeOutline,
	KnowledgeSearchResult,
	KnowledgeTypeOutline,
} from "@shared/types";
import { createTestWrapper } from "@test/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearSearchAtom,
	createKnowledgeAtom,
	deleteKnowledgeAtom,
	editingKnowledgeIdAtom,
	executeSearchAtom,
	filteredKnowledgeListAtom,
	isSearchingAtom,
	knowledgeListAtom,
	knowledgeTypesAtom,
	loadKnowledgeAtom,
	loadKnowledgeTypesAtom,
	newlyCreatedKnowledgeIdAtom,
	reloadKnowledgeTypesAtom,
	searchQueryAtom,
	searchResultsAtom,
	selectedTypeIdAtom,
	typeCountsAtom,
	updateKnowledgeInListAtom,
	updateKnowledgeTitleInListAtom,
} from "./store";

vi.mock("./commands", () => ({
	getKnowledgeByWork: vi.fn(),
	getKnowledgeTypesByWork: vi.fn(),
	createKnowledge: vi.fn(),
	deleteKnowledge: vi.fn(),
	updateKnowledgeTitle: vi.fn(),
	searchKnowledge: vi.fn(),
}));

import {
	createKnowledge as createKnowledgeCmd,
	deleteKnowledge as deleteKnowledgeCmd,
	getKnowledgeByWork,
	getKnowledgeTypesByWork,
	searchKnowledge,
	updateKnowledgeTitle,
} from "./commands";

const mockGetKnowledgeByWork = vi.mocked(getKnowledgeByWork);
const mockGetKnowledgeTypesByWork = vi.mocked(getKnowledgeTypesByWork);
const mockCreateKnowledge = vi.mocked(createKnowledgeCmd);
const mockDeleteKnowledge = vi.mocked(deleteKnowledgeCmd);
const mockUpdateKnowledgeTitle = vi.mocked(updateKnowledgeTitle);
const mockSearchKnowledge = vi.mocked(searchKnowledge);

describe("knowledge/store", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	const createKnowledge = (
		overrides: Partial<KnowledgeOutline> = {},
	): KnowledgeOutline => ({
		id: "1",
		type_id: "type-1",
		title: "Test Knowledge",
		sort_order: 0,
		...overrides,
	});

	const createSearchResult = (
		overrides: Partial<KnowledgeSearchResult> = {},
	): KnowledgeSearchResult => ({
		id: "1",
		type_id: "type-1",
		title: "Test Knowledge",
		matched_text: "test",
		...overrides,
	});

	const createKnowledgeType = (
		overrides: Partial<KnowledgeTypeOutline> = {},
	): KnowledgeTypeOutline => ({
		id: "type-1",
		name: "メモ",
		color: null,
		icon: null,
		sort_order: 0,
		count: 0,
		...overrides,
	});

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		vi.clearAllMocks();
	});

	describe("isSearchingAtom", () => {
		it("検索クエリが空の場合はfalse", () => {
			store.set(searchQueryAtom, "");
			expect(store.get(isSearchingAtom)).toBe(false);
		});

		it("検索クエリが空白のみの場合はfalse", () => {
			store.set(searchQueryAtom, "   ");
			expect(store.get(isSearchingAtom)).toBe(false);
		});

		it("検索クエリがある場合はtrue", () => {
			store.set(searchQueryAtom, "テスト");
			expect(store.get(isSearchingAtom)).toBe(true);
		});
	});

	describe("typeCountsAtom", () => {
		it("リストがnullの場合はnullを返す", () => {
			store.set(knowledgeListAtom, null);
			expect(store.get(typeCountsAtom)).toBeNull();
		});

		it("空リストの場合は空オブジェクトを返す", () => {
			store.set(knowledgeListAtom, []);
			expect(store.get(typeCountsAtom)).toEqual({});
		});

		it("type_idごとのカウントを集計する", () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "1", type_id: "type-1" }),
				createKnowledge({ id: "2", type_id: "type-2" }),
				createKnowledge({ id: "3", type_id: "type-1" }),
				createKnowledge({ id: "4", type_id: "type-1" }),
			]);

			const counts = store.get(typeCountsAtom);
			expect(counts).toEqual({ "type-1": 3, "type-2": 1 });
		});
	});

	describe("editingKnowledgeIdAtom", () => {
		it("初期値はnull", () => {
			expect(store.get(editingKnowledgeIdAtom)).toBeNull();
		});

		it("編集中のIDを設定できる", () => {
			store.set(editingKnowledgeIdAtom, "k-1");
			expect(store.get(editingKnowledgeIdAtom)).toBe("k-1");
		});
	});

	describe("newlyCreatedKnowledgeIdAtom", () => {
		it("初期値はnull", () => {
			expect(store.get(newlyCreatedKnowledgeIdAtom)).toBeNull();
		});
	});

	describe("loadKnowledgeAtom", () => {
		it("作品のナレッジを読み込める", async () => {
			const list = [createKnowledge({ id: "k-1" })];
			mockGetKnowledgeByWork.mockResolvedValueOnce({
				ok: true,
				value: list,
			});

			await store.set(loadKnowledgeAtom, "work-1");

			expect(store.get(knowledgeListAtom)).toEqual(list);
			expect(mockGetKnowledgeByWork).toHaveBeenCalledWith("work-1");
		});

		it("読み込み失敗時はリストを更新しない", async () => {
			store.set(knowledgeListAtom, [createKnowledge({ id: "existing" })]);
			mockGetKnowledgeByWork.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "DB error" },
			});

			await store.set(loadKnowledgeAtom, "work-1");

			expect(store.get(knowledgeListAtom)).toHaveLength(1);
			expect(store.get(knowledgeListAtom)?.[0].id).toBe("existing");
		});
	});

	describe("loadKnowledgeTypesAtom", () => {
		it("ナレッジタイプを読み込める", async () => {
			const types = [createKnowledgeType({ id: "type-1" })];
			mockGetKnowledgeTypesByWork.mockResolvedValueOnce({
				ok: true,
				value: types,
			});

			await store.set(loadKnowledgeTypesAtom, "work-1");

			expect(store.get(knowledgeTypesAtom)).toEqual(types);
		});

		it("読み込み失敗時はタイプを更新しない", async () => {
			const existingTypes = [createKnowledgeType({ id: "existing-type" })];
			store.set(knowledgeTypesAtom, existingTypes);
			mockGetKnowledgeTypesByWork.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "DB error" },
			});

			await store.set(loadKnowledgeTypesAtom, "work-1");

			expect(store.get(knowledgeTypesAtom)?.[0].id).toBe("existing-type");
		});
	});

	describe("createKnowledgeAtom", () => {
		it("選択中のタイプでナレッジを作成できる", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 2 }),
			]);
			store.set(selectedTypeIdAtom, "type-1");
			mockCreateKnowledge.mockResolvedValueOnce({
				ok: true,
				value: "new-id",
			});

			await store.set(createKnowledgeAtom, { title: "新しいナレッジ" });

			const list = store.get(knowledgeListAtom);
			expect(list).toHaveLength(1);
			expect(list?.[0]).toEqual({
				id: "new-id",
				type_id: "type-1",
				title: "新しいナレッジ",
				sort_order: 0,
			});
			expect(mockCreateKnowledge).toHaveBeenCalledWith(
				"type-1",
				"新しいナレッジ",
			);
		});

		it("タイプ未選択時はメモタイプがデフォルトで使われる", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({
					id: "memo-type",
					name: "メモ",
				}),
				createKnowledgeType({
					id: "char-type",
					name: "キャラクター",
				}),
			]);
			store.set(selectedTypeIdAtom, null);
			mockCreateKnowledge.mockResolvedValueOnce({
				ok: true,
				value: "new-id",
			});

			await store.set(createKnowledgeAtom, { title: "テスト" });

			expect(mockCreateKnowledge).toHaveBeenCalledWith("memo-type", "テスト");
		});

		it("タイプが存在しない場合はバリデーションエラーを返す", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, []);
			store.set(selectedTypeIdAtom, null);

			const result = await store.set(createKnowledgeAtom, {
				title: "テスト",
			});

			expect(result).toEqual({
				ok: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "No knowledge type available",
				},
			});
			expect(mockCreateKnowledge).not.toHaveBeenCalled();
		});

		it("作成成功時にタイプのcountが増加する", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 3 }),
			]);
			store.set(selectedTypeIdAtom, "type-1");
			mockCreateKnowledge.mockResolvedValueOnce({
				ok: true,
				value: "new-id",
			});

			await store.set(createKnowledgeAtom, { title: "テスト" });

			const types = store.get(knowledgeTypesAtom);
			expect(types?.[0].count).toBe(4);
		});

		it("作成成功時にnewlyCreatedKnowledgeIdAtomが設定される", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, [createKnowledgeType({ id: "type-1" })]);
			store.set(selectedTypeIdAtom, "type-1");
			mockCreateKnowledge.mockResolvedValueOnce({
				ok: true,
				value: "new-id",
			});

			await store.set(createKnowledgeAtom, { title: "テスト" });

			expect(store.get(newlyCreatedKnowledgeIdAtom)).toBe("new-id");
		});

		it("作成失敗時はリストを更新しない", async () => {
			store.set(knowledgeListAtom, []);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 3 }),
			]);
			store.set(selectedTypeIdAtom, "type-1");
			mockCreateKnowledge.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "DB error" },
			});

			await store.set(createKnowledgeAtom, { title: "テスト" });

			expect(store.get(knowledgeListAtom)).toHaveLength(0);
			expect(store.get(knowledgeTypesAtom)?.[0].count).toBe(3);
		});
	});

	describe("deleteKnowledgeAtom", () => {
		it("ナレッジを削除できる", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
				createKnowledge({ id: "k-2", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 2 }),
			]);
			mockDeleteKnowledge.mockResolvedValueOnce({ ok: true, value: undefined });

			await store.set(deleteKnowledgeAtom, "k-1");

			const list = store.get(knowledgeListAtom);
			expect(list).toHaveLength(1);
			expect(list?.[0].id).toBe("k-2");
		});

		it("削除成功時にタイプのcountが減少する", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 5 }),
			]);
			mockDeleteKnowledge.mockResolvedValueOnce({ ok: true, value: undefined });

			await store.set(deleteKnowledgeAtom, "k-1");

			const types = store.get(knowledgeTypesAtom);
			expect(types?.[0].count).toBe(4);
		});

		it("countが0未満にならない", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 0 }),
			]);
			mockDeleteKnowledge.mockResolvedValueOnce({ ok: true, value: undefined });

			await store.set(deleteKnowledgeAtom, "k-1");

			const types = store.get(knowledgeTypesAtom);
			expect(types?.[0].count).toBe(0);
		});

		it("削除失敗時はリストを更新しない", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 1 }),
			]);
			mockDeleteKnowledge.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "DB error" },
			});

			await store.set(deleteKnowledgeAtom, "k-1");

			expect(store.get(knowledgeListAtom)).toHaveLength(1);
			expect(store.get(knowledgeTypesAtom)?.[0].count).toBe(1);
		});
	});

	describe("updateKnowledgeInListAtom", () => {
		it("タイトルを更新できる", () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", title: "旧タイトル" }),
			]);

			store.set(updateKnowledgeInListAtom, {
				id: "k-1",
				title: "新タイトル",
			});

			const list = store.get(knowledgeListAtom);
			expect(list?.[0].title).toBe("新タイトル");
		});

		it("type_idを変更するとカウントが調整される", () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 3 }),
				createKnowledgeType({ id: "type-2", name: "キャラクター", count: 1 }),
			]);

			store.set(updateKnowledgeInListAtom, {
				id: "k-1",
				type_id: "type-2",
			});

			const types = store.get(knowledgeTypesAtom);
			const type1 = types?.find((t) => t.id === "type-1");
			const type2 = types?.find((t) => t.id === "type-2");
			expect(type1?.count).toBe(2);
			expect(type2?.count).toBe(2);
		});

		it("同じtype_idへの更新ではカウントが変わらない", () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 3 }),
			]);

			store.set(updateKnowledgeInListAtom, {
				id: "k-1",
				type_id: "type-1",
			});

			const types = store.get(knowledgeTypesAtom);
			expect(types?.[0].count).toBe(3);
		});

		it("type_idを指定しない場合はカウントが変わらない", () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", type_id: "type-1" }),
			]);
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 3 }),
			]);

			store.set(updateKnowledgeInListAtom, {
				id: "k-1",
				title: "新タイトル",
			});

			const types = store.get(knowledgeTypesAtom);
			expect(types?.[0].count).toBe(3);
		});
	});

	describe("updateKnowledgeTitleInListAtom", () => {
		it("バックエンド同期付きでタイトルを更新できる", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", title: "旧タイトル" }),
			]);
			mockUpdateKnowledgeTitle.mockResolvedValueOnce({
				ok: true,
				value: undefined,
			});

			await store.set(updateKnowledgeTitleInListAtom, {
				knowledgeId: "k-1",
				title: "新タイトル",
			});

			expect(store.get(knowledgeListAtom)?.[0].title).toBe("新タイトル");
			expect(mockUpdateKnowledgeTitle).toHaveBeenCalledWith(
				"k-1",
				"新タイトル",
			);
		});

		it("バックエンド同期失敗時はタイトルを更新しない", async () => {
			store.set(knowledgeListAtom, [
				createKnowledge({ id: "k-1", title: "旧タイトル" }),
			]);
			mockUpdateKnowledgeTitle.mockResolvedValueOnce({
				ok: false,
				error: { code: "DATABASE_ERROR", message: "DB error" },
			});

			await store.set(updateKnowledgeTitleInListAtom, {
				knowledgeId: "k-1",
				title: "新タイトル",
			});

			expect(store.get(knowledgeListAtom)?.[0].title).toBe("旧タイトル");
		});
	});

	describe("reloadKnowledgeTypesAtom", () => {
		it("ナレッジタイプをリロードできる", async () => {
			store.set(knowledgeTypesAtom, [
				createKnowledgeType({ id: "type-1", count: 0 }),
			]);
			mockGetKnowledgeTypesByWork.mockResolvedValueOnce({
				ok: true,
				value: [createKnowledgeType({ id: "type-1", count: 5 })],
			});

			await store.set(reloadKnowledgeTypesAtom, "work-1");

			expect(store.get(knowledgeTypesAtom)?.[0].count).toBe(5);
		});
	});

	describe("executeSearchAtom", () => {
		it("検索を実行できる", async () => {
			const results = [createSearchResult({ id: "k-1" })];
			mockSearchKnowledge.mockResolvedValueOnce({
				ok: true,
				value: results,
			});

			await store.set(executeSearchAtom, {
				workId: "work-1",
				query: "テスト",
			});

			expect(store.get(searchResultsAtom)).toEqual(results);
			expect(mockSearchKnowledge).toHaveBeenCalledWith("work-1", "テスト");
		});

		it("空クエリの場合は検索結果をクリアする", async () => {
			store.set(searchResultsAtom, [createSearchResult()]);

			await store.set(executeSearchAtom, {
				workId: "work-1",
				query: "  ",
			});

			expect(store.get(searchResultsAtom)).toBeNull();
			expect(mockSearchKnowledge).not.toHaveBeenCalled();
		});
	});

	describe("clearSearchAtom", () => {
		it("検索状態をクリアする", () => {
			store.set(searchQueryAtom, "テスト");
			store.set(searchResultsAtom, [createSearchResult()]);

			store.set(clearSearchAtom);

			expect(store.get(searchQueryAtom)).toBe("");
			expect(store.get(searchResultsAtom)).toBeNull();
		});
	});

	describe("filteredKnowledgeListAtom", () => {
		describe("基本動作", () => {
			it("リストがnullの場合はnullを返す", () => {
				store.set(knowledgeListAtom, null);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toBeNull();
			});

			it("フィルタなしの場合は全件を返す", () => {
				const list = [
					createKnowledge({ id: "1" }),
					createKnowledge({ id: "2" }),
					createKnowledge({ id: "3" }),
				];
				store.set(knowledgeListAtom, list);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(3);
			});
		});

		describe("タイプフィルタ", () => {
			it("選択タイプでフィルタできる", () => {
				const list = [
					createKnowledge({ id: "1", type_id: "type-1" }),
					createKnowledge({ id: "2", type_id: "type-2" }),
					createKnowledge({ id: "3", type_id: "type-1" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(selectedTypeIdAtom, "type-1");

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(2);
				expect(result?.map((k) => k.id)).toEqual(["1", "3"]);
			});
		});

		describe("検索（バックエンド結果あり）", () => {
			it("バックエンド検索結果のIDでフィルタする", () => {
				const list = [
					createKnowledge({ id: "1", title: "メモ1" }),
					createKnowledge({ id: "2", title: "メモ2" }),
					createKnowledge({ id: "3", title: "メモ3" }),
				];
				const searchResults = [
					createSearchResult({ id: "1" }),
					createSearchResult({ id: "3" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "メモ");
				store.set(searchResultsAtom, searchResults);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(2);
				expect(result?.map((k) => k.id)).toEqual(["1", "3"]);
			});

			it("検索結果 + タイプフィルタの組み合わせ", () => {
				const list = [
					createKnowledge({ id: "1", type_id: "type-1" }),
					createKnowledge({ id: "2", type_id: "type-2" }),
					createKnowledge({ id: "3", type_id: "type-1" }),
				];
				const searchResults = [
					createSearchResult({ id: "1" }),
					createSearchResult({ id: "2" }),
					createSearchResult({ id: "3" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "test");
				store.set(searchResultsAtom, searchResults);
				store.set(selectedTypeIdAtom, "type-1");

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(2);
				expect(result?.map((k) => k.id)).toEqual(["1", "3"]);
			});
		});

		describe("検索（ローカルフィルタ）", () => {
			it("バックエンド結果がない場合はタイトルでローカルフィルタ", () => {
				const list = [
					createKnowledge({ id: "1", title: "キャラクター設定" }),
					createKnowledge({ id: "2", title: "世界観メモ" }),
					createKnowledge({ id: "3", title: "キャラ相関図" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "キャラ");
				store.set(searchResultsAtom, null);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(2);
				expect(result?.map((k) => k.id)).toEqual(["1", "3"]);
			});

			it("大文字小文字を区別しない", () => {
				const list = [
					createKnowledge({ id: "1", title: "Character Settings" }),
					createKnowledge({ id: "2", title: "World Memo" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "CHARACTER");
				store.set(searchResultsAtom, null);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(1);
				expect(result?.[0].id).toBe("1");
			});

			it("ローカルフィルタ + タイプフィルタの組み合わせ", () => {
				const list = [
					createKnowledge({ id: "1", title: "キャラ1", type_id: "type-1" }),
					createKnowledge({ id: "2", title: "キャラ2", type_id: "type-2" }),
					createKnowledge({ id: "3", title: "世界観", type_id: "type-1" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "キャラ");
				store.set(searchResultsAtom, null);
				store.set(selectedTypeIdAtom, "type-1");

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(1);
				expect(result?.[0].id).toBe("1");
			});
		});

		describe("エッジケース", () => {
			it("空白のみの検索クエリはフィルタしない", () => {
				const list = [
					createKnowledge({ id: "1" }),
					createKnowledge({ id: "2" }),
				];
				store.set(knowledgeListAtom, list);
				store.set(searchQueryAtom, "   ");

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toHaveLength(2);
			});

			it("空のリストは空配列を返す", () => {
				store.set(knowledgeListAtom, []);

				const result = store.get(filteredKnowledgeListAtom);

				expect(result).toEqual([]);
			});
		});
	});
});
