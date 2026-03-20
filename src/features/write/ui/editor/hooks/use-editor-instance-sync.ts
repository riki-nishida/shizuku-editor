import {
	canRedoAtom,
	canUndoAtom,
	editorInstanceAtom,
} from "@features/write/model/editor/store";
import type { Editor } from "@tiptap/react";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

export const useEditorInstanceSync = (editor: Editor | null) => {
	const setEditorInstance = useSetAtom(editorInstanceAtom);
	const setCanUndo = useSetAtom(canUndoAtom);
	const setCanRedo = useSetAtom(canRedoAtom);

	useEffect(() => {
		if (editor) {
			setEditorInstance(editor);
			setCanUndo(editor.can().undo());
			setCanRedo(editor.can().redo());

			const onTransaction = () => {
				setCanUndo(editor.can().undo());
				setCanRedo(editor.can().redo());
			};
			editor.on("transaction", onTransaction);

			return () => {
				editor.off("transaction", onTransaction);
				setEditorInstance(null);
				setCanUndo(false);
				setCanRedo(false);
			};
		}
		setEditorInstance(null);
		setCanUndo(false);
		setCanRedo(false);
	}, [editor, setEditorInstance, setCanUndo, setCanRedo]);
};
