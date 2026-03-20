import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface FocusModeOptions {
	enabled: boolean;
	activeClass: string;
}

const focusModePluginKey = new PluginKey("focusMode");

export const FocusMode = Extension.create<FocusModeOptions>({
	name: "focusMode",

	addOptions() {
		return {
			enabled: false,
			activeClass: "is-active",
		};
	},

	addProseMirrorPlugins() {
		const { enabled, activeClass } = this.options;

		return [
			new Plugin({
				key: focusModePluginKey,
				props: {
					decorations: (state) => {
						if (!enabled) {
							return DecorationSet.empty;
						}

						const { selection } = state;
						const decorations: Decoration[] = [];

						const $pos = selection.$head;
						let activeNodePos: number | null = null;
						let activeNodeSize = 0;

						for (let depth = $pos.depth; depth >= 0; depth--) {
							const node = $pos.node(depth);
							if (
								node.type.name === "paragraph" ||
								node.type.name === "heading" ||
								node.type.name === "blockquote"
							) {
								activeNodePos = $pos.before(depth);
								activeNodeSize = node.nodeSize;
								break;
							}
						}

						if (activeNodePos !== null) {
							decorations.push(
								Decoration.node(activeNodePos, activeNodePos + activeNodeSize, {
									class: activeClass,
								}),
							);
						}

						return DecorationSet.create(state.doc, decorations);
					},
				},
			}),
		];
	},
});
