import type { Editor } from "@tiptap/react";
import { useEffect } from "react";

export const useEditorEditable = (editor: Editor | null, editable: boolean) => {
	useEffect(() => {
		if (!editor) return;
		editor.setEditable(editable);
	}, [editor, editable]);
};
