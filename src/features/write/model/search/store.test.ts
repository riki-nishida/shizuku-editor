import { sidebarSectionsAtom } from "@shared/store";
import { createTestWrapper } from "@test/utils";
import { beforeEach, describe, expect, it } from "vitest";
import {
	closeSearchPanelAtom,
	materialsHiddenBySearchAtom,
	openSearchPanelAtom,
	searchPanelVisibleAtom,
} from "./store";

describe("openSearchPanelAtom", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
	});

	it("資料セクションが開いている場合、一時的に閉じてフラグを立てる", () => {
		store.set(sidebarSectionsAtom, { outline: true, materials: true });

		store.set(openSearchPanelAtom);

		expect(store.get(searchPanelVisibleAtom)).toBe(true);
		expect(store.get(materialsHiddenBySearchAtom)).toBe(true);
		expect(store.get(sidebarSectionsAtom).materials).toBe(false);
	});

	it("資料セクションが閉じている場合、フラグを立てない", () => {
		store.set(sidebarSectionsAtom, { outline: true, materials: false });

		store.set(openSearchPanelAtom);

		expect(store.get(searchPanelVisibleAtom)).toBe(true);
		expect(store.get(materialsHiddenBySearchAtom)).toBe(false);
		expect(store.get(sidebarSectionsAtom).materials).toBe(false);
	});
});

describe("closeSearchPanelAtom", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
	});

	it("一時的に閉じた資料セクションを復元する", () => {
		store.set(sidebarSectionsAtom, { outline: true, materials: false });
		store.set(materialsHiddenBySearchAtom, true);
		store.set(searchPanelVisibleAtom, true);

		store.set(closeSearchPanelAtom);

		expect(store.get(searchPanelVisibleAtom)).toBe(false);
		expect(store.get(materialsHiddenBySearchAtom)).toBe(false);
		expect(store.get(sidebarSectionsAtom).materials).toBe(true);
	});

	it("元々閉じていた資料セクションは復元しない", () => {
		store.set(sidebarSectionsAtom, { outline: true, materials: false });
		store.set(materialsHiddenBySearchAtom, false);
		store.set(searchPanelVisibleAtom, true);

		store.set(closeSearchPanelAtom);

		expect(store.get(searchPanelVisibleAtom)).toBe(false);
		expect(store.get(materialsHiddenBySearchAtom)).toBe(false);
		expect(store.get(sidebarSectionsAtom).materials).toBe(false);
	});

	it("検索パネルを開いて閉じるフルサイクル", () => {
		store.set(sidebarSectionsAtom, { outline: true, materials: true });

		store.set(openSearchPanelAtom);
		expect(store.get(sidebarSectionsAtom).materials).toBe(false);
		expect(store.get(searchPanelVisibleAtom)).toBe(true);

		store.set(closeSearchPanelAtom);
		expect(store.get(sidebarSectionsAtom).materials).toBe(true);
		expect(store.get(searchPanelVisibleAtom)).toBe(false);
	});
});
