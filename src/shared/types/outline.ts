import type { ChapterOutline, SceneOutline } from "./scene";

export type WorkOutline = {
	chapters: ChapterOutline[];
	scenes: SceneOutline[];
};

export type WorkStatistics = {
	total_word_count: number;
	scene_count: number;
	chapter_count: number;
};
