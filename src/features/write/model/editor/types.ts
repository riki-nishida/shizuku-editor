import type { ContentMarkup } from "@shared/lib/tiptap-japanese";

export type { ContentMarkup } from "@shared/lib/tiptap-japanese";
export type { ChapterOutline, Scene, SceneOutline } from "@shared/types";

export type EditorChangeValue = {
	contentText: string;
	contentMarkups: ContentMarkup[];
};
