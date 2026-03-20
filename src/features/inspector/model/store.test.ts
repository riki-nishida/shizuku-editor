import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./commands", () => ({
	getInspectorSections: vi.fn(),
	saveInspectorSections: vi.fn(),
	getInspectorTab: vi.fn(),
	saveInspectorTab: vi.fn(),
}));

import {
	getInspectorSections,
	getInspectorTab,
	saveInspectorSections,
	saveInspectorTab,
} from "./commands";
import {
	collapseAllInspectorSectionsAtom,
	expandAllInspectorSectionsAtom,
	inspectorSectionsAtom,
	inspectorTabAtom,
	loadInspectorSectionsAtom,
	loadInspectorTabAtom,
	setInspectorTabAtom,
	toggleInspectorSectionAtom,
} from "./store";

const mockGetInspectorSections = vi.mocked(getInspectorSections);
const mockSaveInspectorSections = vi.mocked(saveInspectorSections);
const mockGetInspectorTab = vi.mocked(getInspectorTab);
const mockSaveInspectorTab = vi.mocked(saveInspectorTab);

describe("inspector store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();

		mockSaveInspectorSections.mockResolvedValue({ ok: true, value: undefined });
		mockSaveInspectorTab.mockResolvedValue({ ok: true, value: undefined });
	});

	describe("inspectorSectionsAtom", () => {
		it("should have default sections", () => {
			const sections = store.get(inspectorSectionsAtom);
			expect(sections.versionHistory).toBe(false);
		});

		it("loadInspectorSectionsAtom should merge with defaults", async () => {
			mockGetInspectorSections.mockResolvedValue({
				ok: true,
				value: {
					versionHistory: true,
				},
			});

			await store.set(loadInspectorSectionsAtom);

			const sections = store.get(inspectorSectionsAtom);
			expect(sections.versionHistory).toBe(true);
		});

		it("loadInspectorSectionsAtom should keep defaults on failure", async () => {
			mockGetInspectorSections.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadInspectorSectionsAtom);

			const sections = store.get(inspectorSectionsAtom);
			expect(sections.versionHistory).toBe(false);
		});

		it("toggleInspectorSectionAtom should toggle a section", async () => {
			expect(store.get(inspectorSectionsAtom).versionHistory).toBe(false);

			await store.set(toggleInspectorSectionAtom, "versionHistory");

			expect(store.get(inspectorSectionsAtom).versionHistory).toBe(true);
			expect(mockSaveInspectorSections).toHaveBeenCalled();

			await store.set(toggleInspectorSectionAtom, "versionHistory");

			expect(store.get(inspectorSectionsAtom).versionHistory).toBe(false);
		});

		it("toggleInspectorSectionAtom should handle unknown section", async () => {
			await store.set(toggleInspectorSectionAtom, "unknownSection");

			expect(store.get(inspectorSectionsAtom).unknownSection).toBe(true);
		});

		it("expandAllInspectorSectionsAtom should expand all", async () => {
			store.set(inspectorSectionsAtom, {
				versionHistory: true,
			});

			await store.set(expandAllInspectorSectionsAtom);

			const sections = store.get(inspectorSectionsAtom);
			expect(sections.versionHistory).toBe(false);
			expect(mockSaveInspectorSections).toHaveBeenCalled();
		});

		it("collapseAllInspectorSectionsAtom should collapse all", async () => {
			await store.set(collapseAllInspectorSectionsAtom);

			const sections = store.get(inspectorSectionsAtom);
			expect(sections.versionHistory).toBe(true);
			expect(mockSaveInspectorSections).toHaveBeenCalled();
		});
	});

	describe("inspectorTabAtom", () => {
		it("should default to 'meta'", () => {
			expect(store.get(inspectorTabAtom)).toBe("meta");
		});

		it("loadInspectorTabAtom should load from persistence", async () => {
			mockGetInspectorTab.mockResolvedValue({
				ok: true,
				value: "knowledge",
			});

			await store.set(loadInspectorTabAtom);

			expect(store.get(inspectorTabAtom)).toBe("knowledge");
		});

		it("loadInspectorTabAtom should keep default on failure", async () => {
			mockGetInspectorTab.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadInspectorTabAtom);

			expect(store.get(inspectorTabAtom)).toBe("meta");
		});

		it("setInspectorTabAtom should set and save", async () => {
			await store.set(setInspectorTabAtom, "images");

			expect(store.get(inspectorTabAtom)).toBe("images");
			expect(mockSaveInspectorTab).toHaveBeenCalledWith("images");
		});
	});
});
