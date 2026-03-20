import type { ChapterOutline, SceneOutline, WorkOutline } from "@shared/types";
import { useMemo } from "react";

export type ChapterWithScenes = ChapterOutline & { scenes: SceneOutline[] };

type UseStructuredOutlineParams = {
	nodes: WorkOutline | undefined;
};

export const useStructuredOutline = ({ nodes }: UseStructuredOutlineParams) => {
	return useMemo(() => {
		if (!nodes) {
			return {
				active: [],
				deleted: [],
				orphaned: [],
			};
		}

		const activeChapters = nodes.chapters.filter((ch) => !ch.is_deleted);
		const deletedChapters = nodes.chapters.filter((ch) => ch.is_deleted);
		const deletedChapterIds = new Set(deletedChapters.map((c) => c.id));

		const activeScenes = nodes.scenes
			.filter((scene) => !scene.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);
		const deletedScenes = nodes.scenes
			.filter((scene) => scene.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);

		const activeScenesByChapter = groupScenesByChapter(activeScenes);
		const active = structureChapters(activeChapters, activeScenesByChapter);

		const deletedScenesByChapter = groupScenesByChapter(deletedScenes);
		const deleted = structureChapters(deletedChapters, deletedScenesByChapter);

		const orphaned = deletedScenes.filter(
			(scene) => !deletedChapterIds.has(scene.chapter_id),
		);

		return {
			active,
			deleted,
			orphaned,
		};
	}, [nodes]);
};

function groupScenesByChapter(
	scenes: SceneOutline[],
): Map<string, SceneOutline[]> {
	return scenes.reduce((map, scene) => {
		const chapterScenes = map.get(scene.chapter_id) ?? [];
		chapterScenes.push(scene);
		map.set(scene.chapter_id, chapterScenes);
		return map;
	}, new Map<string, SceneOutline[]>());
}

function structureChapters(
	chapters: ChapterOutline[],
	scenesByChapter: Map<string, SceneOutline[]>,
): ChapterWithScenes[] {
	return chapters
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((chapter) => ({
			...chapter,
			scenes: scenesByChapter.get(chapter.id) ?? [],
		}));
}
