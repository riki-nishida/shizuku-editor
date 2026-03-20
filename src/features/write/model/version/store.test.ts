import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./commands", () => ({
	getSceneVersions: vi.fn(),
}));

import { getSceneVersions } from "./commands";
import {
	loadSceneVersionsAtom,
	refreshSceneVersionsAtom,
	sceneVersionsAtom,
} from "./store";

const mockGetSceneVersions = vi.mocked(getSceneVersions);

const mockVersion1 = {
	id: "version-1",
	scene_id: "scene-1",
	content_text: "Version 1 content",
	content_markups: "[]",
	label: null,
	created_at: "2024-01-01T00:00:00Z",
};

const mockVersion2 = {
	id: "version-2",
	scene_id: "scene-1",
	content_text: "Version 2 content",
	content_markups: "[]",
	label: "Draft",
	created_at: "2024-01-02T00:00:00Z",
};

describe("version store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();
	});

	describe("sceneVersionsAtom", () => {
		it("デフォルト値は空配列", () => {
			expect(store.get(sceneVersionsAtom)).toEqual([]);
		});
	});

	describe("loadSceneVersionsAtom", () => {
		it("シーンのバージョンを読み込める", async () => {
			mockGetSceneVersions.mockResolvedValue({
				ok: true,
				value: [mockVersion1, mockVersion2],
			});

			await store.set(loadSceneVersionsAtom, "scene-1");

			expect(store.get(sceneVersionsAtom)).toEqual([
				mockVersion1,
				mockVersion2,
			]);
			expect(mockGetSceneVersions).toHaveBeenCalledWith("scene-1");
		});

		it("sceneId が null の場合はバージョンをクリアする", async () => {
			store.set(sceneVersionsAtom, [mockVersion1]);

			await store.set(loadSceneVersionsAtom, null);

			expect(store.get(sceneVersionsAtom)).toEqual([]);
			expect(mockGetSceneVersions).not.toHaveBeenCalled();
		});

		it("失敗時は現在のバージョンを維持する", async () => {
			store.set(sceneVersionsAtom, [mockVersion1]);
			mockGetSceneVersions.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSceneVersionsAtom, "scene-1");

			expect(store.get(sceneVersionsAtom)).toEqual([mockVersion1]);
		});
	});

	describe("refreshSceneVersionsAtom", () => {
		it("バージョンが存在する場合はリフレッシュする", async () => {
			store.set(sceneVersionsAtom, [mockVersion1]);
			const updatedVersions = [mockVersion1, mockVersion2];
			mockGetSceneVersions.mockResolvedValue({
				ok: true,
				value: updatedVersions,
			});

			await store.set(refreshSceneVersionsAtom);

			expect(store.get(sceneVersionsAtom)).toEqual(updatedVersions);
			expect(mockGetSceneVersions).toHaveBeenCalledWith("scene-1");
		});

		it("バージョンが空の場合は何もしない", async () => {
			await store.set(refreshSceneVersionsAtom);

			expect(mockGetSceneVersions).not.toHaveBeenCalled();
		});

		it("失敗時は現在のバージョンを維持する", async () => {
			store.set(sceneVersionsAtom, [mockVersion1]);
			mockGetSceneVersions.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(refreshSceneVersionsAtom);

			expect(store.get(sceneVersionsAtom)).toEqual([mockVersion1]);
		});
	});
});
