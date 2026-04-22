import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Options for the {@link AutoTateChuYoko} extension.
 */
export interface AutoTateChuYokoOptions {
	/** Whether auto tate-chu-yoko detection is enabled. Default: `false`. */
	enabled: boolean;
	/**
	 * CSS class applied to auto-detected tate-chu-yoko numbers.
	 * Default: `"auto-tate-chu-yoko"`.
	 */
	decorationClass: string;
}

const NUMBER_REGEX = /\d{1,2}/g;

const pluginKey = new PluginKey("autoTateChuYoko");

/**
 * Automatically detects 1-2 digit numbers in text and applies a decoration
 * class for tate-chu-yoko rendering. Skips numbers that already have an
 * explicit {@link TateChuYoko} mark applied.
 *
 * This is a decoration-only extension — it does not modify the document content.
 *
 * @example
 * ```ts
 * AutoTateChuYoko.configure({
 *   enabled: true,
 *   decorationClass: "auto-tcy",
 * })
 * ```
 */
export const AutoTateChuYoko = Extension.create<AutoTateChuYokoOptions>({
	name: "autoTateChuYoko",

	addOptions() {
		return {
			enabled: false,
			decorationClass: "auto-tate-chu-yoko",
		};
	},

	addProseMirrorPlugins() {
		const { enabled, decorationClass } = this.options;

		return [
			new Plugin({
				key: pluginKey,
				props: {
					decorations: (state) => {
						if (!enabled) {
							return DecorationSet.empty;
						}

						const decorations: Decoration[] = [];
						const { doc, schema } = state;

						const tateChuYokoMark = schema.marks.tateChuYoko ?? null;

						doc.descendants((node, pos) => {
							if (!node.isText || !node.text) {
								return;
							}

							const text = node.text;

							if (tateChuYokoMark) {
								const hasTateChuYoko = node.marks.some(
									(mark) => mark.type === tateChuYokoMark,
								);
								if (hasTateChuYoko) {
									return;
								}
							}

							for (const match of text.matchAll(NUMBER_REGEX)) {
								if (match.index === undefined) continue;

								const from = pos + match.index;
								const to = from + match[0].length;

								decorations.push(
									Decoration.inline(from, to, {
										class: decorationClass,
									}),
								);
							}
						});

						return DecorationSet.create(doc, decorations);
					},
				},
			}),
		];
	},
});
