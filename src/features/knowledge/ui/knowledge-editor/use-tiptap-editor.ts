import { SaveShortcut } from "@shared/lib/tiptap";
import { type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";

export type EditorContent = {
	html: string;
	plainText: string;
};

type Params = {
	value: string;
	onChange: (content: EditorContent) => void;
	onSave: () => void;
};

export const useKnowledgeTipTapEditor = ({
	value,
	onChange,
	onSave,
}: Params): Editor | null => {
	const latestOnChangeRef = useRef(onChange);
	const latestOnSaveRef = useRef(onSave);

	useEffect(() => {
		latestOnChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		latestOnSaveRef.current = onSave;
	}, [onSave]);

	const initialValueRef = useRef(value);

	const extensions = useMemo(
		() => [
			StarterKit,
			SaveShortcut.configure({
				onSave: () => latestOnSaveRef.current(),
			}),
		],
		[],
	);

	const editor = useEditor(
		{
			extensions,
			content: initialValueRef.current,
			onUpdate: ({ editor: instance }: { editor: Editor }) => {
				latestOnChangeRef.current?.({
					html: instance.getHTML(),
					plainText: instance.getText(),
				});
			},
		},
		[extensions],
	);

	useEffect(() => {
		if (!editor) return;
		const currentHtml = editor.getHTML();
		if (value !== currentHtml) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [editor, value]);

	return editor;
};
