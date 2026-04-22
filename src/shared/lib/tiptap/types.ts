import type { ContentMarkup } from "@shared/lib/tiptap-japanese";
import type { Extensions } from "@tiptap/core";

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
