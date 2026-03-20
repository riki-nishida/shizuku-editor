import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestWrapper } from "@/test/utils";
import {
	editorSettingsAtom,
	loadSettingsAtom,
	settingsAtom,
	themeSettingsAtom,
} from "./store";
import { DEFAULT_SETTINGS, type Settings } from "./types";

vi.mock("./commands", () => ({
	getSettings: vi.fn(),
	saveSettings: vi.fn(),
}));

import { getSettings, saveSettings } from "./commands";

const mockGetSettings = vi.mocked(getSettings);
const mockSaveSettings = vi.mocked(saveSettings);

describe("settings/store", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];

	const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
		...DEFAULT_SETTINGS,
		...overrides,
	});

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		vi.clearAllMocks();

		store.set(settingsAtom, DEFAULT_SETTINGS);

		Object.defineProperty(document, "documentElement", {
			value: {
				classList: {
					add: vi.fn(),
					remove: vi.fn(),
				},
				dataset: {},
			},
			writable: true,
		});
		Object.defineProperty(document, "body", {
			value: { dataset: {} },
			writable: true,
		});

		vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
			cb(0);
			return 0;
		});
	});

	describe("settingsAtom", () => {
		it("初期値は DEFAULT_SETTINGS", () => {
			const settings = store.get(settingsAtom);
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});

		it("設定を更新できる", () => {
			const newSettings = createSettings({
				editor: { ...DEFAULT_SETTINGS.editor, fontSize: 20 },
			});

			store.set(settingsAtom, newSettings);

			expect(store.get(settingsAtom).editor.fontSize).toBe(20);
		});
	});

	describe("loadSettingsAtom", () => {
		it("設定を読み込んで適用できる", async () => {
			const loadedSettings = createSettings({
				theme: { theme: "dark" },
				editor: { ...DEFAULT_SETTINGS.editor, writingMode: "vertical" },
			});
			mockGetSettings.mockResolvedValueOnce({
				ok: true,
				value: loadedSettings,
			});

			await store.set(loadSettingsAtom);

			const settings = store.get(settingsAtom);
			expect(settings.theme.theme).toBe("dark");
			expect(settings.editor.writingMode).toBe("vertical");
			expect(mockGetSettings).toHaveBeenCalled();
		});

		it("読み込み失敗時は設定を更新しない", async () => {
			mockGetSettings.mockResolvedValueOnce({
				ok: false,
				error: { code: "IO_ERROR", message: "Failed to load" },
			});

			await store.set(loadSettingsAtom);

			const settings = store.get(settingsAtom);
			expect(settings).toEqual(DEFAULT_SETTINGS);
		});
	});

	describe("editorSettingsAtom", () => {
		it("エディタ設定を取得できる", () => {
			const editorSettings = store.get(editorSettingsAtom);
			expect(editorSettings).toEqual(DEFAULT_SETTINGS.editor);
		});

		it("エディタ設定を部分更新できる", async () => {
			mockSaveSettings.mockResolvedValueOnce({
				ok: true,
				value: DEFAULT_SETTINGS,
			});

			await store.set(editorSettingsAtom, { fontSize: 18 });

			const editorSettings = store.get(editorSettingsAtom);
			expect(editorSettings.fontSize).toBe(18);
			expect(editorSettings.fontFamily).toBe("system");
			expect(mockSaveSettings).toHaveBeenCalled();
		});
	});

	describe("themeSettingsAtom", () => {
		it("テーマ設定を取得できる", () => {
			const themeSettings = store.get(themeSettingsAtom);
			expect(themeSettings).toEqual(DEFAULT_SETTINGS.theme);
		});

		it("テーマを変更できる", async () => {
			mockSaveSettings.mockResolvedValueOnce({
				ok: true,
				value: DEFAULT_SETTINGS,
			});

			await store.set(themeSettingsAtom, { theme: "dark" });

			const themeSettings = store.get(themeSettingsAtom);
			expect(themeSettings.theme).toBe("dark");
			expect(mockSaveSettings).toHaveBeenCalled();
		});
	});

	describe("統合テスト", () => {
		it("複数の設定変更が独立して機能する", async () => {
			mockSaveSettings.mockResolvedValue({ ok: true, value: DEFAULT_SETTINGS });

			await store.set(editorSettingsAtom, { fontSize: 20 });
			await store.set(themeSettingsAtom, { theme: "dark" });

			const settings = store.get(settingsAtom);
			expect(settings.editor.fontSize).toBe(20);
			expect(settings.theme.theme).toBe("dark");
		});
	});
});
