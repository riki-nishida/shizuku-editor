import type { Mark } from "@tiptap/pm/model";
import { Fragment, type Schema, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Creates a ProseMirror plugin that converts markup notation in pasted
 * plain text into the corresponding marks.
 *
 * @param pluginName - Unique name for the plugin key
 * @param regex - A **global** regex. Captured groups are forwarded to
 *   the `createMark` callback.
 * @param createMark - Receives each regex match and returns the display
 *   text and mark instance to apply
 */
export const createMarkupPastePlugin = (
	pluginName: string,
	regex: RegExp,
	createMark: (match: RegExpMatchArray) => {
		text: string;
		mark: Mark;
	},
): Plugin =>
	new Plugin({
		key: new PluginKey(pluginName),
		props: {
			handlePaste: (view, event, _slice) => {
				const text = event.clipboardData?.getData("text/plain");
				if (!text || !regex.test(text)) {
					return false;
				}

				regex.lastIndex = 0;

				const { state } = view;
				const { schema } = state;

				const nodes: ReturnType<Schema["text"]>[] = [];
				let lastIndex = 0;

				for (const match of text.matchAll(regex)) {
					if (match.index > lastIndex) {
						nodes.push(schema.text(text.slice(lastIndex, match.index)));
					}

					const { text: markedText, mark } = createMark(match);
					nodes.push(schema.text(markedText, [mark]));

					lastIndex = match.index + match[0].length;
				}

				if (lastIndex < text.length) {
					nodes.push(schema.text(text.slice(lastIndex)));
				}

				if (nodes.length === 0) {
					return false;
				}

				const tr = state.tr;
				const fragment = Fragment.from(nodes);
				tr.replaceSelection(new Slice(fragment, 0, 0));
				view.dispatch(tr);

				return true;
			},
		},
	});
