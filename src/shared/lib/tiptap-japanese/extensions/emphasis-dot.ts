import { InputRule, Mark, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { createMarkupPastePlugin } from "../helpers/create-markup-paste-plugin";
import type { MarkupDisplayMode } from "../types";

/**
 * Options for the {@link EmphasisDot} mark extension.
 */
export interface EmphasisDotOptions {
	/** Additional HTML attributes to add to the rendered element. */
	HTMLAttributes: Record<string, unknown>;
	/**
	 * How to render emphasis dots in the editor.
	 * - `"wysiwyg"`: Renders with the `emphasisDotClass` CSS class
	 * - `"notation"`: Renders with the `notationClass` CSS class
	 *
	 * Default: `"wysiwyg"`.
	 */
	displayMode: MarkupDisplayMode;
	/** CSS class applied in WYSIWYG mode. Default: `"emphasis-dot"`. */
	emphasisDotClass: string;
	/** CSS class applied in notation mode. Default: `"emphasis-dot-notation"`. */
	notationClass: string;
}

/** Input syntax: `《《emphasized text》》` */
const EMPHASIS_DOT_INPUT_REGEX = /《《([^《》]+)》》$/;
const EMPHASIS_DOT_GLOBAL_REGEX = /《《([^《》]+)》》/g;

/**
 * Emphasis dot (傍点 / bouton) mark for Japanese text.
 *
 * Places dots above (or beside in vertical writing) characters to indicate
 * emphasis — a common typographic convention in Japanese publishing.
 *
 * @example
 * ```ts
 * EmphasisDot.configure({ displayMode: "wysiwyg" })
 *
 * editor.commands.setEmphasisDot();
 * editor.commands.unsetEmphasisDot();
 * ```
 */
export const EmphasisDot = Mark.create<EmphasisDotOptions>({
	name: "emphasisDot",

	inclusive: false,
	exitable: true,

	addOptions() {
		return {
			HTMLAttributes: {},
			displayMode: "wysiwyg",
			emphasisDotClass: "emphasis-dot",
			notationClass: "emphasis-dot-notation",
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-emphasis-dot]",
			},
			{
				tag: 'em[data-type="emphasis-dot"]',
			},
		];
	},

	renderHTML({
		HTMLAttributes,
	}: {
		HTMLAttributes: Record<string, unknown>;
	}): DOMOutputSpec {
		if (this.options.displayMode === "notation") {
			return [
				"span",
				mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
					class: this.options.notationClass,
					"data-emphasis-dot": "true",
				}),
				0,
			];
		}

		return [
			"span",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: this.options.emphasisDotClass,
				"data-emphasis-dot": "true",
			}),
			0,
		];
	},

	addInputRules() {
		return [
			new InputRule({
				find: EMPHASIS_DOT_INPUT_REGEX,
				handler: ({ state, range, match, chain }) => {
					const text = match[1];

					const { tr } = state;
					const start = range.from;
					const end = range.to;

					tr.delete(start, end);

					const emphasisMark = this.type.create();
					const textNode = state.schema.text(text, [emphasisMark]);

					tr.insert(start, textNode);

					chain().run();
				},
			}),
		];
	},

	addCommands() {
		return {
			setEmphasisDot:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleEmphasisDot:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
			unsetEmphasisDot:
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
				"emphasisDotPaste",
				EMPHASIS_DOT_GLOBAL_REGEX,
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
		emphasisDot: {
			/** Apply emphasis dots to the selected text. */
			setEmphasisDot: () => ReturnType;
			/** Toggle emphasis dots on the selected text. */
			toggleEmphasisDot: () => ReturnType;
			/** Remove emphasis dots from the selected text. */
			unsetEmphasisDot: () => ReturnType;
		};
	}
}
