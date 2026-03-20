import { invokeCommand } from "@shared/lib/commands";
import type { ChapterOutline, Scene, SceneOutline } from "./types";

export const getScene = (sceneId: string) => {
	return invokeCommand<Scene>("get_scene", { sceneId });
};

export const createScene = (chapterId: string, title: string) => {
	return invokeCommand<SceneOutline>("create_scene", {
		chapterId,
		title,
	});
};

export const updateSceneTitle = (sceneId: string, title: string) => {
	return invokeCommand<void>("update_scene_title", { sceneId, title });
};

export const updateSceneContent = (
	sceneId: string,
	contentText: string,
	contentMarkups: string,
) => {
	return invokeCommand<void>("update_scene_content", {
		sceneId,
		contentText,
		contentMarkups,
	});
};

export const updateSceneSynopsis = (sceneId: string, synopsis: string) => {
	return invokeCommand<void>("update_scene_synopsis", { sceneId, synopsis });
};

export const updateSceneWordCount = (sceneId: string, wordCount: number) => {
	return invokeCommand<void>("update_scene_word_count", {
		sceneId,
		wordCount,
	});
};

export const updateSceneSortOrder = (sceneId: string, newSortOrder: number) => {
	return invokeCommand<void>("update_scene_sort_order", {
		sceneId,
		newSortOrder,
	});
};

export const moveSceneToChapter = (
	sceneId: string,
	newChapterId: string,
	newSortOrder: number,
) => {
	return invokeCommand<void>("move_scene_to_chapter", {
		sceneId,
		newChapterId,
		newSortOrder,
	});
};

export const deleteScene = (sceneId: string) => {
	return invokeCommand<void>("delete_scene", { sceneId });
};

export const restoreScene = (sceneId: string) => {
	return invokeCommand<void>("restore_scene", { sceneId });
};

export const permanentDeleteScene = (sceneId: string) => {
	return invokeCommand<void>("permanent_delete_scene", { sceneId });
};

export const getScenesByChapter = (chapterId: string) => {
	return invokeCommand<Scene[]>("get_scenes_by_chapter", { chapterId });
};

export const createChapter = (workId: string, title: string) => {
	return invokeCommand<ChapterOutline>("create_chapter", { workId, title });
};

export const updateChapterTitle = (chapterId: string, title: string) => {
	return invokeCommand<void>("update_chapter_title", { chapterId, title });
};

export const updateChapterSortOrder = (
	chapterId: string,
	newSortOrder: number,
) => {
	return invokeCommand<void>("update_chapter_sort_order", {
		chapterId,
		newSortOrder,
	});
};

export const deleteChapter = (chapterId: string) => {
	return invokeCommand<void>("delete_chapter", { chapterId });
};

export const restoreChapter = (chapterId: string) => {
	return invokeCommand<void>("restore_chapter", { chapterId });
};

export const permanentDeleteChapter = (chapterId: string) => {
	return invokeCommand<void>("permanent_delete_chapter", { chapterId });
};
