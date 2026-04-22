import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const WHITESPACE_CHARS = [" ", "\u3000", "\t", "\u00A0"];

const DIALOGUE_START_CHARS = [
	"\u300C",
	"\u300E",
	"\uFF08",
	"(",
	'"',
	"'",
	"\u2018",
	"\u2019",
	"\u201C",
	"\u201D",
	"\u3010",
	"\u3008",
	"\u300A",
];

const SPECIAL_START_CHARS = [
	"\u2014",
	"\u2015",
	"\u2500",
	"\u2013",
	"\u2026",
	"\u22EF",
	"\u30FB",
	"\u25CF",
	"\u25CB",
	"\u25A0",
	"\u25A1",
	"\u25C6",
	"\u25C7",
	"\u25B2",
	"\u25B3",
	"\u25BC",
	"\u25BD",
	"\u2605",
	"\u2606",
	"\u203B",
	"\u2020",
	"\u2021",
	"\uFF0A",
	"*",
	"\u2192",
	"\u2190",
	"\u2191",
	"\u2193",
	"\u21D2",
	"\u21D0",
];

/**
 * Determines whether a paragraph should receive automatic first-line indentation.
 *
 * Returns `false` for paragraphs starting with:
 * - Whitespace (already indented manually)
 * - Dialogue opening characters (`「`, `『`, `(`, `"`, etc.)
 * - Special symbols (`—`, `…`, `・`, `●`, `※`, `→`, etc.)
 * - Empty strings
 *
 * @param text - The text content of the paragraph
 * @returns `true` if the paragraph should be auto-indented
 */
export const shouldAutoIndent = (text: string): boolean => {
	if (text.length === 0) {
		return false;
	}

	const firstChar = text.charAt(0);

	if (WHITESPACE_CHARS.includes(firstChar)) {
		return false;
	}

	if (DIALOGUE_START_CHARS.includes(firstChar)) {
		return false;
	}

	if (SPECIAL_START_CHARS.includes(firstChar)) {
		return false;
	}

	return true;
};

/**
 * Options for the {@link AutoIndent} extension.
 */
export interface AutoIndentOptions {
	/** Whether auto-indentation is enabled. Default: `true`. */
	enabled: boolean;
	/**
	 * CSS class applied to paragraphs that should be indented.
	 * Default: `"auto-indent"`.
	 */
	indentClass: string;
}

const autoIndentPluginKey = new PluginKey("autoIndent");

/**
 * Automatically applies a CSS class to paragraphs that should have
 * first-line indentation according to Japanese typographic conventions.
 *
 * Paragraphs starting with dialogue markers, dashes, bullets, or existing
 * whitespace are excluded. This is a decoration-only extension — it does
 * not modify the document content.
 *
 * @example
 * ```ts
 * AutoIndent.configure({
 *   enabled: true,
 *   indentClass: "auto-indent",
 * })
 * ```
 *
 * ```css
 * .auto-indent { text-indent: 1em; }
 * ```
 */
export const AutoIndent = Extension.create<AutoIndentOptions>({
	name: "autoIndent",

	addOptions() {
		return {
			enabled: true,
			indentClass: "auto-indent",
		};
	},

	addProseMirrorPlugins() {
		const { enabled, indentClass } = this.options;

		return [
			new Plugin({
				key: autoIndentPluginKey,
				props: {
					decorations: (state) => {
						if (!enabled) {
							return DecorationSet.empty;
						}

						const decorations: Decoration[] = [];

						state.doc.descendants((node, pos) => {
							if (node.type.name === "paragraph") {
								if (shouldAutoIndent(node.textContent)) {
									decorations.push(
										Decoration.node(pos, pos + node.nodeSize, {
											class: indentClass,
										}),
									);
								}
							}
						});

						return DecorationSet.create(state.doc, decorations);
					},
				},
			}),
		];
	},
});
