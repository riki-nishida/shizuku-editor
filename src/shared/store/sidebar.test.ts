import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/lib/commands/app-state", () => ({
	getSidebarSections: vi.fn(),
	saveSidebarSections: vi.fn(),
	getSidebarSectionRatio: vi.fn(),
	saveSidebarSectionRatio: vi.fn(),
}));

import {
	getSidebarSectionRatio,
	getSidebarSections,
	saveSidebarSectionRatio,
	saveSidebarSections,
} from "@shared/lib/commands/app-state";
import {
	loadSidebarSectionRatioAtom,
	loadSidebarSectionsAtom,
	saveSidebarSectionRatioAtom,
	sidebarSectionRatioAtom,
	sidebarSectionsAtom,
	toggleSidebarSectionAtom,
} from "./sidebar";

const mockGetSidebarSections = vi.mocked(getSidebarSections);
const mockSaveSidebarSections = vi.mocked(saveSidebarSections);
const mockGetSidebarSectionRatio = vi.mocked(getSidebarSectionRatio);
const mockSaveSidebarSectionRatio = vi.mocked(saveSidebarSectionRatio);

describe("sidebar store", () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.clearAllMocks();

		mockSaveSidebarSections.mockResolvedValue({ ok: true, value: undefined });
		mockSaveSidebarSectionRatio.mockResolvedValue({
			ok: true,
			value: undefined,
		});
	});

	describe("sidebarSectionsAtom", () => {
		it("デフォルトでは両セクションが開いている", () => {
			const sections = store.get(sidebarSectionsAtom);
			expect(sections.outline).toBe(true);
			expect(sections.materials).toBe(true);
		});

		it("loadSidebarSectionsAtom で永続化から読み込める", async () => {
			mockGetSidebarSections.mockResolvedValue({
				ok: true,
				value: { outline: false, materials: true },
			});

			await store.set(loadSidebarSectionsAtom);

			const sections = store.get(sidebarSectionsAtom);
			expect(sections.outline).toBe(false);
			expect(sections.materials).toBe(true);
		});

		it("loadSidebarSectionsAtom で失敗時はデフォルトを維持する", async () => {
			mockGetSidebarSections.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSidebarSectionsAtom);

			const sections = store.get(sidebarSectionsAtom);
			expect(sections.outline).toBe(true);
			expect(sections.materials).toBe(true);
		});

		it("toggleSidebarSectionAtom でアウトラインセクションをトグルする", async () => {
			expect(store.get(sidebarSectionsAtom).outline).toBe(true);

			await store.set(toggleSidebarSectionAtom, "outline");

			expect(store.get(sidebarSectionsAtom).outline).toBe(false);
			expect(mockSaveSidebarSections).toHaveBeenCalledWith({
				outline: false,
				materials: true,
			});
		});

		it("toggleSidebarSectionAtom で資料セクションをトグルする", async () => {
			expect(store.get(sidebarSectionsAtom).materials).toBe(true);

			await store.set(toggleSidebarSectionAtom, "materials");

			expect(store.get(sidebarSectionsAtom).materials).toBe(false);
			expect(mockSaveSidebarSections).toHaveBeenCalledWith({
				outline: true,
				materials: false,
			});
		});

		it("toggleSidebarSectionAtom でトグルを往復できる", async () => {
			await store.set(toggleSidebarSectionAtom, "outline");
			expect(store.get(sidebarSectionsAtom).outline).toBe(false);

			await store.set(toggleSidebarSectionAtom, "outline");
			expect(store.get(sidebarSectionsAtom).outline).toBe(true);
		});
	});

	describe("sidebarSectionRatioAtom", () => {
		it("デフォルト比率は 0.6", () => {
			const ratio = store.get(sidebarSectionRatioAtom);
			expect(ratio).toBe(0.6);
		});

		it("loadSidebarSectionRatioAtom で永続化から読み込める", async () => {
			mockGetSidebarSectionRatio.mockResolvedValue({
				ok: true,
				value: 0.7,
			});

			await store.set(loadSidebarSectionRatioAtom);

			expect(store.get(sidebarSectionRatioAtom)).toBe(0.7);
		});

		it("loadSidebarSectionRatioAtom で失敗時はデフォルトを維持する", async () => {
			mockGetSidebarSectionRatio.mockResolvedValue({
				ok: false,
				error: { code: "INTERNAL_ERROR", message: "Failed" },
			});

			await store.set(loadSidebarSectionRatioAtom);

			expect(store.get(sidebarSectionRatioAtom)).toBe(0.6);
		});

		it("saveSidebarSectionRatioAtom で比率を保存・更新できる", async () => {
			await store.set(saveSidebarSectionRatioAtom, 0.5);

			expect(store.get(sidebarSectionRatioAtom)).toBe(0.5);
			expect(mockSaveSidebarSectionRatio).toHaveBeenCalledWith(0.5);
		});

		it("saveSidebarSectionRatioAtom で端の値を処理できる", async () => {
			await store.set(saveSidebarSectionRatioAtom, 0);
			expect(store.get(sidebarSectionRatioAtom)).toBe(0);

			await store.set(saveSidebarSectionRatioAtom, 1);
			expect(store.get(sidebarSectionRatioAtom)).toBe(1);
		});
	});
});
