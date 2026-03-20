import type { ContentMarkup } from "tiptap-japanese";

export type { ChapterOutline, Scene, SceneOutline } from "@shared/types";
export type { ContentMarkup } from "tiptap-japanese";

export type EditorChangeValue = {
	contentText: string;
	contentMarkups: ContentMarkup[];
};
