import { atom, useAtom } from "jotai";

export type ChapterViewMode = "corkboard" | "manuscript";

export const chapterViewModeAtom = atom<ChapterViewMode>("corkboard");

export const useChapterViewMode = () => {
	const [viewMode, setViewMode] = useAtom(chapterViewModeAtom);

	return {
		viewMode,
		setViewMode,
	};
};
