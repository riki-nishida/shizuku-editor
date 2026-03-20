import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const SearchAndReplacePluginKey = new PluginKey("searchAndReplace");

export const SearchAndReplace = Extension.create({
	name: "searchAndReplace",

	addStorage() {
		return {
			searchTerm: "",
			replaceTerm: "",
			caseSensitive: false,
			results: [] as { from: number; to: number }[],
			currentIndex: -1,
		};
	},
	addCommands() {
		return {
			setSearchTerm:
				(searchTerm: string) =>
				({ editor }) => {
					editor.storage.searchAndReplace.searchTerm = searchTerm;
					editor.storage.searchAndReplace.currentIndex = -1;
					editor.view.dispatch(editor.state.tr);
					return true;
				},
			setReplaceTerm:
				(replaceTerm: string) =>
				({ editor }) => {
					editor.storage.searchAndReplace.replaceTerm = replaceTerm;
					return true;
				},
			setCaseSensitive:
				(caseSensitive: boolean) =>
				({ editor }) => {
					editor.storage.searchAndReplace.caseSensitive = caseSensitive;
					editor.view.dispatch(editor.state.tr);
					return true;
				},
			nextSearchResult:
				() =>
				({ editor }) => {
					const { results, currentIndex } = editor.storage.searchAndReplace;
					if (results.length === 0) return false;

					const nextIndex = (currentIndex + 1) % results.length;
					const result = results[nextIndex];
					if (!result) return false;

					editor.storage.searchAndReplace.currentIndex = nextIndex;
					editor.commands.setTextSelection({
						from: result.from,
						to: result.to,
					});
					editor.commands.scrollIntoView();
					editor.view.dispatch(editor.state.tr);
					return true;
				},
			previousSearchResult:
				() =>
				({ editor }) => {
					const { results, currentIndex } = editor.storage.searchAndReplace;
					if (results.length === 0) return false;

					const prevIndex =
						currentIndex <= 0 ? results.length - 1 : currentIndex - 1;
					const result = results[prevIndex];
					if (!result) return false;

					editor.storage.searchAndReplace.currentIndex = prevIndex;
					editor.commands.setTextSelection({
						from: result.from,
						to: result.to,
					});
					editor.commands.scrollIntoView();
					editor.view.dispatch(editor.state.tr);
					return true;
				},
			replace:
				() =>
				({ editor, state }) => {
					const { results, currentIndex, replaceTerm } =
						editor.storage.searchAndReplace;
					if (results.length === 0 || currentIndex < 0) return false;

					const result = results[currentIndex];
					if (!result) return false;

					const tr = state.tr.insertText(replaceTerm, result.from, result.to);
					editor.view.dispatch(tr);

					queueMicrotask(() => {
						editor.view.dispatch(editor.state.tr);
					});

					return true;
				},
			replaceAll:
				() =>
				({ editor, state }) => {
					const { results, replaceTerm } = editor.storage.searchAndReplace;
					if (results.length === 0) return false;

					let tr = state.tr;
					for (let i = results.length - 1; i >= 0; i--) {
						const result = results[i];
						if (result) {
							tr = tr.insertText(replaceTerm, result.from, result.to);
						}
					}

					editor.view.dispatch(tr);

					queueMicrotask(() => {
						editor.storage.searchAndReplace.currentIndex = -1;
						editor.view.dispatch(editor.state.tr);
					});

					return true;
				},
		};
	},
	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: SearchAndReplacePluginKey,
				state: {
					init() {
						return DecorationSet.empty;
					},
					apply: (
						_tr: Transaction,
						_oldState: DecorationSet,
						_oldEditorState: EditorState,
						newEditorState: EditorState,
					) => {
						const { searchTerm, caseSensitive } =
							this.editor.storage.searchAndReplace;

						if (!searchTerm) {
							this.editor.storage.searchAndReplace.results = [];
							return DecorationSet.empty;
						}

						const decorations: Decoration[] = [];
						const results: { from: number; to: number }[] = [];
						const currentIndex =
							this.editor.storage.searchAndReplace.currentIndex;

						const searchRegex = new RegExp(
							searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
							caseSensitive ? "g" : "gi",
						);
						let resultIndex = 0;
						newEditorState.doc.descendants((node: Node, pos: number) => {
							if (node.isText && node.text) {
								const nodeText = node.text;
								searchRegex.lastIndex = 0;

								let match: RegExpExecArray | null;
								// biome-ignore lint: while loop with assignment is intentional for regex matching
								while ((match = searchRegex.exec(nodeText)) !== null) {
									const from = pos + match.index;
									const to = from + match[0].length;
									results.push({ from, to });

									const isCurrent =
										currentIndex >= 0 && resultIndex === currentIndex;
									decorations.push(
										Decoration.inline(from, to, {
											class: isCurrent
												? "search-result-current"
												: "search-result",
										}),
									);
									resultIndex++;
								}
							}
						});

						this.editor.storage.searchAndReplace.results = results;
						return DecorationSet.create(newEditorState.doc, decorations);
					},
				},
				props: {
					decorations(state: EditorState) {
						return SearchAndReplacePluginKey.getState(state);
					},
				},
			}),
		];
	},
});

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		searchAndReplace: {
			setSearchTerm: (searchTerm: string) => ReturnType;
			setReplaceTerm: (replaceTerm: string) => ReturnType;
			setCaseSensitive: (caseSensitive: boolean) => ReturnType;
			nextSearchResult: () => ReturnType;
			previousSearchResult: () => ReturnType;
			replace: () => ReturnType;
			replaceAll: () => ReturnType;
		};
	}
	interface Storage {
		searchAndReplace: {
			searchTerm: string;
			replaceTerm: string;
			caseSensitive: boolean;
			results: { from: number; to: number }[];
			currentIndex: number;
		};
	}
}
