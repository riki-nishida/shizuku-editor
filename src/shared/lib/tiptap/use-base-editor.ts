import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { type Editor, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import { contentToHtml, htmlToContent } from "tiptap-japanese";
import { SaveShortcut, SnapshotShortcut } from "./extensions";
import type { BaseEditorParams } from "./types";

const EMPTY_EXTENSIONS: BaseEditorParams["extensions"] = [];

export const useBaseEditor = ({
	contentText,
	contentMarkups,
	onChange,
	onSave,
	onSnapshot,
	extensions = EMPTY_EXTENSIONS,
}: BaseEditorParams): Editor | null => {
	const callbacksRef = useRef({ onChange, onSave, onSnapshot });
	useEffect(() => {
		callbacksRef.current = { onChange, onSave, onSnapshot };
	}, [onChange, onSave, onSnapshot]);

	const initialHtmlRef = useRef<string | null>(null);
	if (initialHtmlRef.current === null) {
		initialHtmlRef.current = contentToHtml(contentText, contentMarkups);
	}

	const baseExtensions = useMemo(
		() => [
			Document,
			Paragraph,
			Text,
			HardBreak,
			History,
			Dropcursor,
			Gapcursor,
			SaveShortcut.configure({
				onSave: () => callbacksRef.current.onSave(),
			}),
			SnapshotShortcut.configure({
				onSnapshot: () => callbacksRef.current.onSnapshot?.(),
			}),
		],
		[],
	);

	const allExtensions = useMemo(
		() => [...baseExtensions, ...extensions],
		[baseExtensions, extensions],
	);

	const editor = useEditor(
		{
			extensions: allExtensions,
			content: initialHtmlRef.current,
			onUpdate: ({ editor: instance }: { editor: Editor }) => {
				const html = instance.getHTML();
				const { text, markups } = htmlToContent(html);
				callbacksRef.current.onChange?.({
					contentText: text,
					contentMarkups: markups,
				});
			},
		},
		[allExtensions],
	);

	useEffect(() => {
		if (!editor) return;

		const currentHtml = editor.getHTML();
		const currentContent = htmlToContent(currentHtml);

		const contentChanged =
			currentContent.text !== contentText ||
			JSON.stringify(currentContent.markups) !== JSON.stringify(contentMarkups);

		if (contentChanged) {
			try {
				const newHtml = contentToHtml(contentText, contentMarkups);
				const wrapper = document.createElement("div");
				wrapper.innerHTML = newHtml;
				const doc = ProseMirrorDOMParser.fromSchema(editor.schema).parse(
					wrapper,
				);
				const tr = editor.state.tr.replaceWith(
					0,
					editor.state.doc.content.size,
					doc.content,
				);
				tr.setMeta("addToHistory", false);
				editor.view.dispatch(tr);
			} catch {}
		}
	}, [editor, contentText, contentMarkups]);

	return editor;
};
