export type Theme = "light" | "dark";

export type FontFamilyPreset = "system" | "serif";

export type FontFamily = FontFamilyPreset | (string & {});

export const FONT_FAMILY_PRESETS: {
	value: FontFamilyPreset;
	labelKey: string;
}[] = [
	{ value: "system", labelKey: "settings.editorPanel.fontSystem" },
	{ value: "serif", labelKey: "settings.editorPanel.fontSerif" },
];

export type WritingMode = "horizontal" | "vertical";

export type MarkupDisplayMode = "wysiwyg" | "notation";

export type EditorSettings = {
	fontSize: number;
	fontFamily: FontFamily;
	lineHeight: number;
	writingMode: WritingMode;
	markupDisplayMode: MarkupDisplayMode;
	autoIndent: boolean;
	focusMode: boolean;
};

export type ThemeSettings = {
	theme: Theme;
};

export type Language = "ja" | "en";

export type ExportPerFormat = {
	rubyMode?: string;
	mode?: string;
	pageSize?: string;
	author?: string;
	writingMode?: string;
};

export type PersistedExportSettings = {
	txt: ExportPerFormat;
	docx: ExportPerFormat;
	pdf: ExportPerFormat;
	epub: ExportPerFormat;
};

export type Settings = {
	editor: EditorSettings;
	theme: ThemeSettings;
	language: Language | null;
	export: PersistedExportSettings;
	version: number;
};

export const DEFAULT_SETTINGS: Settings = {
	editor: {
		fontSize: 16,
		fontFamily: "system",
		lineHeight: 1.8,
		writingMode: "horizontal",
		markupDisplayMode: "notation",
		autoIndent: false,
		focusMode: false,
	},
	theme: {
		theme: "light",
	},
	language: null,
	export: { txt: {}, docx: {}, pdf: {}, epub: {} },
	version: 1,
};
