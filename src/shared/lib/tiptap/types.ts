import type { Extensions } from "@tiptap/core";
import type { ContentMarkup } from "tiptap-japanese";

export type EditorContent = {
	contentText: string;
	contentMarkups: ContentMarkup[];
};

export type BaseEditorParams = {
	contentText: string;
	contentMarkups: ContentMarkup[];
	onChange: (content: EditorContent) => void;
	onSave: () => void;
	onSnapshot?: () => void;
	extensions?: Extensions;
};
