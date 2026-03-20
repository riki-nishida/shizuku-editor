import i18n, { detectLanguage } from "@shared/lib/i18n";
import { atom } from "jotai";
import { getSettings, listSystemFonts, saveSettings } from "./commands";
import {
	DEFAULT_SETTINGS,
	type EditorSettings,
	type Language,
	type PersistedExportSettings,
	type Settings,
	type ThemeSettings,
} from "./types";

const applyTheme = (theme: string) => {
	document.documentElement.classList.add("disable-transitions");
	document.documentElement.dataset.theme = theme;
	document.body.dataset.theme = theme;
	requestAnimationFrame(() => {
		document.documentElement.classList.remove("disable-transitions");
	});
};

export const settingsAtom = atom<Settings>(DEFAULT_SETTINGS);

export const loadSettingsAtom = atom(null, async (_get, set) => {
	const result = await getSettings();
	if (result.ok) {
		let settings = result.value;
		if (settings.language === null) {
			const detected = detectLanguage();
			settings = { ...settings, language: detected };
			await saveSettings(settings);
		}
		set(settingsAtom, settings);
		applyTheme(settings.theme.theme);
		i18n.changeLanguage(settings.language as string);
	}
});

export const editorSettingsAtom = atom(
	(get) => get(settingsAtom).editor,
	async (get, set, update: Partial<EditorSettings>) => {
		const current = get(settingsAtom);
		const newSettings = {
			...current,
			editor: { ...current.editor, ...update },
		};
		set(settingsAtom, newSettings);
		await saveSettings(newSettings);
	},
);

export const themeSettingsAtom = atom(
	(get) => get(settingsAtom).theme,
	async (get, set, update: Partial<ThemeSettings>) => {
		const current = get(settingsAtom);
		const newTheme = { ...current.theme, ...update };
		const newSettings = {
			...current,
			theme: newTheme,
		};
		set(settingsAtom, newSettings);
		applyTheme(newTheme.theme);
		await saveSettings(newSettings);
	},
);

export const languageAtom = atom(
	(get): Language => get(settingsAtom).language ?? "ja",
	async (get, set, language: Language) => {
		const current = get(settingsAtom);
		let newSettings = { ...current, language };

		if (language !== "ja") {
			newSettings = {
				...newSettings,
				editor: {
					...newSettings.editor,
					writingMode: "horizontal" as const,
					autoIndent: false,
					markupDisplayMode: "notation" as const,
				},
			};
		}

		set(settingsAtom, newSettings);
		i18n.changeLanguage(language);
		await saveSettings(newSettings);
	},
);

export const exportSettingsAtom = atom(
	(get) => get(settingsAtom).export,
	async (get, set, update: PersistedExportSettings) => {
		const current = get(settingsAtom);
		const newSettings = { ...current, export: update };
		set(settingsAtom, newSettings);
		await saveSettings(newSettings);
	},
);

export const systemFontsAtom = atom<string[]>([]);

export const loadSystemFontsAtom = atom(null, async (get, set) => {
	if (get(systemFontsAtom).length > 0) return;
	const result = await listSystemFonts();
	if (result.ok) {
		set(systemFontsAtom, result.value);
	}
});
