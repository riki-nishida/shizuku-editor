import { InputRule, Mark, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { createMarkupPastePlugin } from "../helpers/create-markup-paste-plugin";
import type { MarkupDisplayMode } from "../types";

/**
 * Options for the {@link Ruby} mark extension.
 */
export interface RubyOptions {
	/** Additional HTML attributes to add to the rendered element. */
	HTMLAttributes: Record<string, unknown>;
	/**
	 * How to render ruby annotations in the editor.
	 * - `"wysiwyg"`: Renders as `<ruby><rb>base</rb><rt>reading</rt></ruby>`
	 * - `"notation"`: Renders as `<span class="ruby-notation">` with a data attribute
	 *
	 * Default: `"wysiwyg"`.
	 */
	displayMode: MarkupDisplayMode;
	/**
	 * CSS class applied when `displayMode` is `"notation"`.
	 * Default: `"ruby-notation"`.
	 */
	notationClass: string;
}

/** Input syntax: `|base text《ruby text》` */
const RUBY_INPUT_REGEX = /\|([^|《》]+)《([^《》]+)》$/;
const RUBY_GLOBAL_REGEX = /\|([^|《》]+)《([^《》]+)》/g;

/**
 * Ruby (furigana) annotation mark for Japanese text.
 *
 * Supports both WYSIWYG and notation display modes, input rules for
 * the `|漢字《かんじ》` syntax, and paste handling.
 *
 * @example
 * ```ts
 * Ruby.configure({ displayMode: "wysiwyg" })
 *
 * // Set ruby on selected text:
 * editor.commands.setRuby("かんじ");
 * // Remove ruby:
 * editor.commands.unsetRuby();
 * ```
 */
export const Ruby = Mark.create<RubyOptions>({
	name: "ruby",

	inclusive: false,
	exitable: true,

	addOptions() {
		return {
			HTMLAttributes: {},
			displayMode: "wysiwyg",
			notationClass: "ruby-notation",
		};
	},

	addAttributes() {
		return {
			ruby: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					const dataRuby = element.getAttribute("data-ruby");
					if (dataRuby) return dataRuby;
					return element.querySelector("rt")?.textContent;
				},
				renderHTML: (attributes: { ruby?: string }) => {
					if (!attributes.ruby) {
						return {};
					}
					return {
						"data-ruby": attributes.ruby,
					};
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "ruby",
				contentElement: "rb",
				getAttrs: (element: HTMLElement) => {
					const rt = element.querySelector("rt");
					return { ruby: rt?.textContent || null };
				},
			},
			{
				tag: "span[data-ruby]",
			},
		];
	},

	renderHTML({
		HTMLAttributes,
	}: {
		HTMLAttributes: Record<string, unknown>;
	}): DOMOutputSpec {
		const ruby = HTMLAttributes["data-ruby"] as string | undefined;

		if (!ruby) {
			return ["span", mergeAttributes(this.options.HTMLAttributes), 0];
		}

		if (this.options.displayMode === "notation") {
			return [
				"span",
				mergeAttributes(this.options.HTMLAttributes, {
					class: this.options.notationClass,
					"data-ruby": ruby,
				}),
				0,
			];
		}

		return [
			"ruby",
			mergeAttributes(this.options.HTMLAttributes),
			["rb", {}, 0],
			["rt", {}, ruby],
		];
	},

	addInputRules() {
		return [
			new InputRule({
				find: RUBY_INPUT_REGEX,
				handler: ({ state, range, match, chain }) => {
					const baseText = match[1];
					const rubyText = match[2];

					const { tr } = state;
					const start = range.from;
					const end = range.to;

					tr.delete(start, end);

					const rubyMark = this.type.create({ ruby: rubyText });
					const textNode = state.schema.text(baseText, [rubyMark]);

					tr.insert(start, textNode);

					chain().run();
				},
			}),
		];
	},

	addCommands() {
		return {
			setRuby:
				(rubyText: string) =>
				({ commands }) => {
					return commands.setMark(this.name, { ruby: rubyText });
				},
			toggleRuby:
				(rubyText: string) =>
				({ commands }) => {
					return commands.toggleMark(this.name, { ruby: rubyText });
				},
			unsetRuby:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addProseMirrorPlugins() {
		const markType = this.type;

		return [
			createMarkupPastePlugin("rubyPaste", RUBY_GLOBAL_REGEX, (match) => ({
				text: match[1],
				mark: markType.create({ ruby: match[2] }),
			})),
		];
	},
});

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		ruby: {
			/** Apply ruby (furigana) annotation to the selected text. */
			setRuby: (rubyText: string) => ReturnType;
			/** Toggle ruby annotation on the selected text. */
			toggleRuby: (rubyText: string) => ReturnType;
			/** Remove ruby annotation from the selected text. */
			unsetRuby: () => ReturnType;
		};
	}
}
