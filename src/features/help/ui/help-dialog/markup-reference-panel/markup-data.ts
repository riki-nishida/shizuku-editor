import type { TFunction } from "i18next";

export type MarkupItem = {
	name: string;
	input: string;
	description: string;
	auto?: boolean;
};

export const getMarkupItems = (t: TFunction): MarkupItem[] => [
	{
		name: t("help.markup.ruby.name"),
		input: "|漢字《かんじ》",
		description: t("help.markup.ruby.description"),
	},
	{
		name: t("help.markup.emphasisDot.name"),
		input: "《《重要》》",
		description: t("help.markup.emphasisDot.description"),
	},
	{
		name: t("help.markup.tateChuYoko.name"),
		input: "^12^",
		description: t("help.markup.tateChuYoko.description"),
	},
	{
		name: t("help.markup.autoIndent.name"),
		input: t("help.markup.autoIndent.input"),
		description: t("help.markup.autoIndent.description"),
		auto: true,
	},
	{
		name: t("help.markup.autoTateChuYoko.name"),
		input: t("help.markup.autoTateChuYoko.input"),
		description: t("help.markup.autoTateChuYoko.description"),
		auto: true,
	},
];
