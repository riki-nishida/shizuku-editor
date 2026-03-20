import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./commands", () => ({
	getSceneImages: vi.fn(),
	addSceneImage: vi.fn(),
	deleteSceneImage: vi.fn(),
	updateSceneImageSortOrder: vi.fn(),
}));

import {
	addSceneImage,
	deleteSceneImage,
	getSceneImages,
	updateSceneImageSortOrder,
} from "./commands";
import {
	addSceneImageAtom,
	deleteSceneImageAtom,
	loadSceneImagesAtom,
	reorderSceneImagesAtom,
	sceneImagesAtom,
	sceneImagesLoadingAtom,
} from "./store";

const mockGetSceneImages = vi.mocked(getSceneImages);
const mockAddSceneImage = vi.mocked(addSceneImage);
const mockDeleteSceneImage = vi.mocked(deleteSceneImage);
const mockUpdateSceneImageSortOrder = vi.mocked(updateSceneImageSortOrder);

const mockImage1 = {
	id: "image-1",
	scene_id: "scene-1",
	file_name: "image1.png",
	file_path: "/path/to/image1.png",
	file_size: 1024,
	mime_type: "image/png",
	sort_order: 0,
	created_at: "2024-01-01T00:00:00Z",
};

const mockImage2 = {
	id: "image-2",
	scene_id: "scene-1",
	file_name: "image2.png",
	file_path: "/path/to/image2.png",
	file_size: 2048,
	mime_type: "image/png",
	sort_order: 1,
	created_at: "2024-01-02T00:00:00Z",
};

describe("scene-image store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();
	});

	describe("sceneImagesAtom", () => {
		it("デフォルト値は空配列", () => {
			expect(store.get(sceneImagesAtom)).toEqual([]);
		});
	});

	describe("sceneImagesLoadingAtom", () => {
		it("デフォルト値は false", () => {
			expect(store.get(sceneImagesLoadingAtom)).toBe(false);
		});
	});

	describe("loadSceneImagesAtom", () => {
		it("画像を読み込みローディング状態を設定する", async () => {
			mockGetSceneImages.mockResolvedValue({
				ok: true,
				value: [mockImage1, mockImage2],
			});

			const loadPromise = store.set(loadSceneImagesAtom, "scene-1");

			expect(store.get(sceneImagesLoadingAtom)).toBe(true);

			await loadPromise;

			expect(store.get(sceneImagesAtom)).toEqual([mockImage1, mockImage2]);
			expect(store.get(sceneImagesLoadingAtom)).toBe(false);
			expect(mockGetSceneImages).toHaveBeenCalledWith("scene-1");
		});

		it("失敗時はローディングを false にする", async () => {
			mockGetSceneImages.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSceneImagesAtom, "scene-1");

			expect(store.get(sceneImagesLoadingAtom)).toBe(false);
			expect(store.get(sceneImagesAtom)).toEqual([]);
		});
	});

	describe("addSceneImageAtom", () => {
		it("リストに画像を追加する", async () => {
			store.set(sceneImagesAtom, [mockImage1]);
			mockAddSceneImage.mockResolvedValue({
				ok: true,
				value: mockImage2,
			});

			const result = await store.set(addSceneImageAtom, {
				sceneId: "scene-1",
				sourcePath: "/source/image2.png",
			});

			expect(result).toEqual(mockImage2);
			expect(store.get(sceneImagesAtom)).toEqual([mockImage1, mockImage2]);
			expect(mockAddSceneImage).toHaveBeenCalledWith(
				"scene-1",
				"/source/image2.png",
			);
		});

		it("失敗時は null を返す", async () => {
			mockAddSceneImage.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(addSceneImageAtom, {
				sceneId: "scene-1",
				sourcePath: "/source/image.png",
			});

			expect(result).toBeNull();
		});
	});

	describe("deleteSceneImageAtom", () => {
		beforeEach(() => {
			store.set(sceneImagesAtom, [mockImage1, mockImage2]);
		});

		it("リストから画像を削除する", async () => {
			mockDeleteSceneImage.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(deleteSceneImageAtom, "image-1");

			expect(result).toBe(true);
			expect(store.get(sceneImagesAtom)).toEqual([mockImage2]);
			expect(mockDeleteSceneImage).toHaveBeenCalledWith("image-1");
		});

		it("失敗時は false を返す", async () => {
			mockDeleteSceneImage.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(deleteSceneImageAtom, "image-1");

			expect(result).toBe(false);
			expect(store.get(sceneImagesAtom)).toEqual([mockImage1, mockImage2]);
		});
	});

	describe("reorderSceneImagesAtom", () => {
		beforeEach(() => {
			store.set(sceneImagesAtom, [mockImage1, mockImage2]);
		});

		it("ソート順を更新しリストを並べ替える", async () => {
			mockUpdateSceneImageSortOrder.mockResolvedValue({
				ok: true,
				value: undefined,
			});

			const result = await store.set(reorderSceneImagesAtom, {
				imageId: "image-2",
				newSortOrder: -1,
			});

			expect(result).toBe(true);
			const images = store.get(sceneImagesAtom);
			expect(images[0].id).toBe("image-2");
			expect(images[1].id).toBe("image-1");
			expect(mockUpdateSceneImageSortOrder).toHaveBeenCalledWith("image-2", -1);
		});

		it("失敗時は false を返す", async () => {
			mockUpdateSceneImageSortOrder.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			const result = await store.set(reorderSceneImagesAtom, {
				imageId: "image-2",
				newSortOrder: -1,
			});

			expect(result).toBe(false);
			const images = store.get(sceneImagesAtom);
			expect(images[0].id).toBe("image-1");
		});
	});
});
