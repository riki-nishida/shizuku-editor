export type SearchMatch = {
	sceneId: string;
	sceneTitle: string;
	chapterId: string;
	chapterTitle: string;

	lineNumber: number;

	lineText: string;

	matchStart: number;

	matchEnd: number;

	charOffset: number;
};

export type ProjectSearchResult = {
	totalMatches: number;
	totalScenes: number;
	matches: SearchMatch[];
};

export type ReplaceResult = {
	replacedCount: number;
	affectedScenes: number;
};
