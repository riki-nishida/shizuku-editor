import { InputRule, Mark, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { createMarkupPastePlugin } from "../helpers/create-markup-paste-plugin";

/**
 * Options for the {@link TateChuYoko} mark extension.
 */
export interface TateChuYokoOptions {
	/** Additional HTML attributes to add to the rendered element. */
	HTMLAttributes: Record<string, unknown>;
	/** CSS class applied to tate-chu-yoko spans. Default: `"tate-chu-yoko"`. */
	tateChuYokoClass: string;
}

/** Input syntax: `^AB^` (1-4 alphanumeric characters) */
const TATE_CHU_YOKO_INPUT_REGEX = /\^([A-Za-z0-9]{1,4})\^$/;
const TATE_CHU_YOKO_GLOBAL_REGEX = /\^([A-Za-z0-9]{1,4})\^/g;

/**
 * Tate-chu-yoko (縦中横) mark for vertical Japanese text.
 *
 * Renders short runs of horizontal characters (typically 1-4 alphanumerics)
 * within vertical text using `text-combine-upright`. Common for numbers,
 * abbreviations, and symbols in vertical typesetting.
 *
 * @example
 * ```ts
 * TateChuYoko.configure({ tateChuYokoClass: "tcy" })
 *
 * editor.commands.setTateChuYoko();
 * editor.commands.unsetTateChuYoko();
 * ```
 */
export const TateChuYoko = Mark.create<TateChuYokoOptions>({
	name: "tateChuYoko",

	inclusive: false,
	exitable: true,

	addOptions() {
		return {
			HTMLAttributes: {},
			tateChuYokoClass: "tate-chu-yoko",
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-tate-chu-yoko]",
			},
			{
				tag: 'span[style*="text-combine-upright"]',
			},
		];
	},

	renderHTML({
		HTMLAttributes,
	}: {
		HTMLAttributes: Record<string, unknown>;
	}): DOMOutputSpec {
		return [
			"span",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: this.options.tateChuYokoClass,
				"data-tate-chu-yoko": "true",
			}),
			0,
		];
	},

	addInputRules() {
		return [
			new InputRule({
				find: TATE_CHU_YOKO_INPUT_REGEX,
				handler: ({ state, range, match, chain }) => {
					const text = match[1];

					const { tr } = state;
					const start = range.from;
					const end = range.to;

					tr.delete(start, end);

					const tateChuYokoMark = this.type.create();
					const textNode = state.schema.text(text, [tateChuYokoMark]);

					tr.insert(start, textNode);

					chain().run();
				},
			}),
		];
	},

	addCommands() {
		return {
			setTateChuYoko:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleTateChuYoko:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
			unsetTateChuYoko:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addProseMirrorPlugins() {
		const markType = this.type;

		return [
			createMarkupPastePlugin(
				"tateChuYokoPaste",
				TATE_CHU_YOKO_GLOBAL_REGEX,
				(match) => ({
					text: match[1],
					mark: markType.create(),
				}),
			),
		];
	},
});

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		tateChuYoko: {
			/** Apply tate-chu-yoko to the selected text. */
			setTateChuYoko: () => ReturnType;
			/** Toggle tate-chu-yoko on the selected text. */
			toggleTateChuYoko: () => ReturnType;
			/** Remove tate-chu-yoko from the selected text. */
			unsetTateChuYoko: () => ReturnType;
		};
	}
}
