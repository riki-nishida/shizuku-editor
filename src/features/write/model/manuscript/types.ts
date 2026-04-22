import type { ContentMarkup } from "@shared/lib/tiptap-japanese";

export type ManuscriptSceneData = {
	id: string;
	title: string;
	contentText: string;
	contentMarkups: ContentMarkup[];
};

export type ManuscriptState = {
	isActive: boolean;

	chapterId: string | null;

	scenes: ManuscriptSceneData[];

	modifiedSceneIds: Set<string>;
};

export type ManuscriptEditorChangeValue = {
	scenes: ManuscriptSceneData[];
	modifiedSceneIds: Set<string>;
};
