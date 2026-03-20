import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./commands", () => ({
	listWorks: vi.fn(),
	createWork: vi.fn(),
	updateWorkName: vi.fn(),
	deleteWork: vi.fn(),
}));

import { createWork, deleteWork, listWorks, updateWorkName } from "./commands";
import {
	activeWorkAtom,
	activeWorkIdAtom,
	createWorkAtom,
	deleteWorkAtom,
	loadWorksAtom,
	updateWorkNameAtom,
	workListAtom,
} from "./store";

const mockListWorks = vi.mocked(listWorks);
const mockCreateWork = vi.mocked(createWork);
const mockUpdateWorkName = vi.mocked(updateWorkName);
const mockDeleteWork = vi.mocked(deleteWork);

const mockWork1 = {
	id: "work-1",
	name: "Work 1",
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
};

const mockWork2 = {
	id: "work-2",
	name: "Work 2",
	created_at: "2024-01-02T00:00:00Z",
	updated_at: "2024-01-02T00:00:00Z",
};

describe("work store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();
	});

	describe("workListAtom", () => {
		it("デフォルト値は空配列", () => {
			expect(store.get(workListAtom)).toEqual([]);
		});

		it("作品リストを更新できる", () => {
			store.set(workListAtom, [mockWork1, mockWork2]);
			expect(store.get(workListAtom)).toEqual([mockWork1, mockWork2]);
		});
	});

	describe("activeWorkIdAtom", () => {
		it("デフォルト値は null", () => {
			expect(store.get(activeWorkIdAtom)).toBeNull();
		});

		it("アクティブ作品 ID を更新できる", () => {
			store.set(activeWorkIdAtom, "work-1");
			expect(store.get(activeWorkIdAtom)).toBe("work-1");
		});
	});

	describe("activeWorkAtom", () => {
		it("アクティブ作品 ID がない場合は null を返す", () => {
			store.set(workListAtom, [mockWork1, mockWork2]);
			expect(store.get(activeWorkAtom)).toBeNull();
		});

		it("アクティブ作品 ID が見つからない場合は null を返す", () => {
			store.set(workListAtom, [mockWork1, mockWork2]);
			store.set(activeWorkIdAtom, "non-existent");
			expect(store.get(activeWorkAtom)).toBeNull();
		});

		it("見つかった場合はアクティブ作品を返す", () => {
			store.set(workListAtom, [mockWork1, mockWork2]);
			store.set(activeWorkIdAtom, "work-1");
			expect(store.get(activeWorkAtom)).toEqual(mockWork1);
		});
	});

	describe("loadWorksAtom", () => {
		it("バックエンドから作品を読み込める", async () => {
			mockListWorks.mockResolvedValue({
				ok: true,
				value: [mockWork1, mockWork2],
			});

			await store.set(loadWorksAtom);

			expect(store.get(workListAtom)).toEqual([mockWork1, mockWork2]);
			expect(mockListWorks).toHaveBeenCalledTimes(1);
		});

		it("失敗時は空リストのまま", async () => {
			mockListWorks.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadWorksAtom);

			expect(store.get(workListAtom)).toEqual([]);
		});
	});

	describe("createWorkAtom", () => {
		it("作品を作成しリストを更新する", async () => {
			const newWork = {
				id: "new-work",
				name: "New Work",
				created_at: "2024-01-03T00:00:00Z",
				updated_at: "2024-01-03T00:00:00Z",
			};

			mockCreateWork.mockResolvedValue({
				ok: true,
				value: "new-work",
			});
			mockListWorks.mockResolvedValue({
				ok: true,
				value: [mockWork1, mockWork2, newWork],
			});

			const result = await store.set(createWorkAtom, "New Work");

			expect(result).toBe("new-work");
			expect(mockCreateWork).toHaveBeenCalledWith("New Work");
			expect(store.get(workListAtom)).toEqual([mockWork1, mockWork2, newWork]);
		});

		it("作成失敗時は null を返す", async () => {
			mockCreateWork.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(createWorkAtom, "New Work");

			expect(result).toBeNull();
		});

		it("リスト更新が失敗しても作品 ID を返す", async () => {
			mockCreateWork.mockResolvedValue({
				ok: true,
				value: "new-work",
			});
			mockListWorks.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(createWorkAtom, "New Work");

			expect(result).toBe("new-work");
		});
	});

	describe("updateWorkNameAtom", () => {
		beforeEach(() => {
			store.set(workListAtom, [mockWork1, mockWork2]);
		});

		it("リスト内の作品名を更新する", async () => {
			mockUpdateWorkName.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(
				updateWorkNameAtom,
				"work-1",
				"Updated Name",
			);

			expect(result).toBe(true);
			expect(mockUpdateWorkName).toHaveBeenCalledWith("work-1", "Updated Name");

			const works = store.get(workListAtom);
			expect(works[0].name).toBe("Updated Name");
			expect(works[1].name).toBe("Work 2");
		});

		it("失敗時は false を返す", async () => {
			mockUpdateWorkName.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(
				updateWorkNameAtom,
				"work-1",
				"Updated Name",
			);

			expect(result).toBe(false);
			expect(store.get(workListAtom)[0].name).toBe("Work 1");
		});
	});

	describe("deleteWorkAtom", () => {
		beforeEach(() => {
			store.set(workListAtom, [mockWork1, mockWork2]);
		});

		it("リストから作品を削除する", async () => {
			mockDeleteWork.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(deleteWorkAtom, "work-1");

			expect(result).toBe(true);
			expect(mockDeleteWork).toHaveBeenCalledWith("work-1");
			expect(store.get(workListAtom)).toEqual([mockWork2]);
		});

		it("失敗時は false を返す", async () => {
			mockDeleteWork.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(deleteWorkAtom, "work-1");

			expect(result).toBe(false);
			expect(store.get(workListAtom)).toEqual([mockWork1, mockWork2]);
		});

		it("存在しない作品の削除を適切に処理する", async () => {
			mockDeleteWork.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(deleteWorkAtom, "non-existent");

			expect(result).toBe(true);
			expect(store.get(workListAtom)).toEqual([mockWork1, mockWork2]);
		});
	});
});
