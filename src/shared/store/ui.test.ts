import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/lib/commands/app-state", () => ({
	getPanelSizes: vi.fn(),
	savePanelSizes: vi.fn(),
	getInspectorCollapsed: vi.fn(),
	saveInspectorCollapsed: vi.fn(),
}));

import {
	getInspectorCollapsed,
	getPanelSizes,
	saveInspectorCollapsed,
	savePanelSizes,
} from "@shared/lib/commands/app-state";
import {
	appInitializedAtom,
	exportDialogOpenAtom,
	inspectorCollapsedAtom,
	keyboardShortcutsDialogOpenAtom,
	liveWordCountAtom,
	loadInspectorCollapsedAtom,
	loadPanelSizesAtom,
	panelSizesAtom,
	savePanelSizesAtom,
	searchPanelOpenAtom,
	setInspectorCollapsedAtom,
	settingsDialogOpenAtom,
	toggleInspectorCollapsedAtom,
} from "./ui";

const mockGetPanelSizes = vi.mocked(getPanelSizes);
const mockSavePanelSizes = vi.mocked(savePanelSizes);
const mockGetInspectorCollapsed = vi.mocked(getInspectorCollapsed);
const mockSaveInspectorCollapsed = vi.mocked(saveInspectorCollapsed);

describe("ui store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();

		mockSavePanelSizes.mockResolvedValue({ ok: true, value: undefined });
		mockSaveInspectorCollapsed.mockResolvedValue({
			ok: true,
			value: undefined,
		});
	});

	describe("simple atoms", () => {
		it("appInitializedAtom should default to false", () => {
			expect(store.get(appInitializedAtom)).toBe(false);
		});

		it("liveWordCountAtom should default to 0", () => {
			expect(store.get(liveWordCountAtom)).toBe(0);
		});

		it("settingsDialogOpenAtom should default to false", () => {
			expect(store.get(settingsDialogOpenAtom)).toBe(false);
		});

		it("exportDialogOpenAtom should default to false", () => {
			expect(store.get(exportDialogOpenAtom)).toBe(false);
		});

		it("keyboardShortcutsDialogOpenAtom should default to false", () => {
			expect(store.get(keyboardShortcutsDialogOpenAtom)).toBe(false);
		});

		it("searchPanelOpenAtom should default to false", () => {
			expect(store.get(searchPanelOpenAtom)).toBe(false);
		});
	});

	describe("panelSizesAtom", () => {
		it("should have default sizes", () => {
			const sizes = store.get(panelSizesAtom);
			expect(sizes).toHaveLength(3);
		});

		it("loadPanelSizesAtom should load sizes from persistence", async () => {
			mockGetPanelSizes.mockResolvedValue({
				ok: true,
				value: [15, 60, 25],
			});

			await store.set(loadPanelSizesAtom);

			expect(store.get(panelSizesAtom)).toEqual([15, 60, 25]);
		});

		it("loadPanelSizesAtom should keep defaults on failure", async () => {
			const defaultSizes = store.get(panelSizesAtom);
			mockGetPanelSizes.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadPanelSizesAtom);

			expect(store.get(panelSizesAtom)).toEqual(defaultSizes);
		});

		it("savePanelSizesAtom should save and update sizes", async () => {
			await store.set(savePanelSizesAtom, [20, 50, 30]);

			expect(store.get(panelSizesAtom)).toEqual([20, 50, 30]);
			expect(mockSavePanelSizes).toHaveBeenCalledWith([20, 50, 30]);
		});

		it("savePanelSizesAtom should rollback on failure", async () => {
			const originalSizes = store.get(panelSizesAtom);
			mockSavePanelSizes.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(savePanelSizesAtom, [20, 50, 30]);

			expect(store.get(panelSizesAtom)).toEqual(originalSizes);
		});
	});

	describe("inspectorCollapsedAtom", () => {
		it("should default to false (expanded)", () => {
			expect(store.get(inspectorCollapsedAtom)).toBe(false);
		});

		it("loadInspectorCollapsedAtom should load from persistence", async () => {
			mockGetInspectorCollapsed.mockResolvedValue({
				ok: true,
				value: true,
			});

			await store.set(loadInspectorCollapsedAtom);

			expect(store.get(inspectorCollapsedAtom)).toBe(true);
		});

		it("loadInspectorCollapsedAtom should keep default on failure", async () => {
			mockGetInspectorCollapsed.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadInspectorCollapsedAtom);

			expect(store.get(inspectorCollapsedAtom)).toBe(false);
		});

		it("toggleInspectorCollapsedAtom should toggle and save", async () => {
			expect(store.get(inspectorCollapsedAtom)).toBe(false);

			await store.set(toggleInspectorCollapsedAtom);

			expect(store.get(inspectorCollapsedAtom)).toBe(true);
			expect(mockSaveInspectorCollapsed).toHaveBeenCalledWith(true);

			await store.set(toggleInspectorCollapsedAtom);

			expect(store.get(inspectorCollapsedAtom)).toBe(false);
			expect(mockSaveInspectorCollapsed).toHaveBeenCalledWith(false);
		});

		it("setInspectorCollapsedAtom should set and save", async () => {
			await store.set(setInspectorCollapsedAtom, true);

			expect(store.get(inspectorCollapsedAtom)).toBe(true);
			expect(mockSaveInspectorCollapsed).toHaveBeenCalledWith(true);
		});
	});
});
