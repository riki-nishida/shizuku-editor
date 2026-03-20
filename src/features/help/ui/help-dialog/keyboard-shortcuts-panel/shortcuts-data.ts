import type { TFunction } from "i18next";

export type ShortcutItem = {
	label: string;
	keys: string;
};

export type ShortcutCategory = {
	title: string;
	items: ShortcutItem[];
};

export const getShortcutCategories = (t: TFunction): ShortcutCategory[] => [
	{
		title: t("help.shortcutCategories.file"),
		items: [
			{ label: t("help.shortcutLabels.newScene"), keys: "Mod+N" },
			{ label: t("help.shortcutLabels.save"), keys: "Mod+S" },
			{ label: t("help.shortcutLabels.snapshotSave"), keys: "Mod+Shift+S" },
			{ label: t("help.shortcutLabels.export"), keys: "Mod+E" },
			{ label: t("help.shortcutLabels.settings"), keys: "Mod+," },
		],
	},
	{
		title: t("help.shortcutCategories.edit"),
		items: [
			{ label: t("help.shortcutLabels.undo"), keys: "Mod+Z" },
			{ label: t("help.shortcutLabels.redo"), keys: "Mod+Shift+Z" },
			{ label: t("help.shortcutLabels.cut"), keys: "Mod+X" },
			{ label: t("help.shortcutLabels.copy"), keys: "Mod+C" },
			{ label: t("help.shortcutLabels.paste"), keys: "Mod+V" },
			{ label: t("help.shortcutLabels.selectAll"), keys: "Mod+A" },
			{ label: t("help.shortcutLabels.find"), keys: "Mod+F" },
		],
	},
	{
		title: t("help.shortcutCategories.view"),
		items: [
			{ label: t("help.shortcutLabels.splitView"), keys: "Mod+\\" },
			{ label: t("help.shortcutLabels.focusMode"), keys: "Mod+Shift+F" },
			{ label: t("help.shortcutLabels.typewriterMode"), keys: "Mod+Shift+T" },
		],
	},
	{
		title: t("help.shortcutCategories.navigate"),
		items: [
			{ label: t("help.shortcutLabels.prevScene"), keys: "Mod+[" },
			{ label: t("help.shortcutLabels.nextScene"), keys: "Mod+]" },
		],
	},
	{
		title: t("help.shortcutCategories.other"),
		items: [{ label: t("help.shortcutLabels.help"), keys: "Mod+/" }],
	},
];
