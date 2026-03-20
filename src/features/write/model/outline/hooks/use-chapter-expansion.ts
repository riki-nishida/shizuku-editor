import { appInitializedAtom } from "@shared/store/ui";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import { expandedChaptersAtom } from "../store";
import type { ChapterWithScenes } from "./use-structured-outline";

export const useChapterExpansion = (
	structuredChapters: ChapterWithScenes[],
) => {
	const [expandedChapters, setExpandedChapters] = useAtom(expandedChaptersAtom);
	const isAppInitialized = useAtomValue(appInitializedAtom);

	const toggle = useCallback(
		(chapterId: string) => {
			setExpandedChapters((current) => ({
				...current,
				[chapterId]: !(current[chapterId] ?? false),
			}));
		},
		[setExpandedChapters],
	);

	const expand = useCallback(
		(chapterId: string) => {
			setExpandedChapters((current) => ({
				...current,
				[chapterId]: true,
			}));
		},
		[setExpandedChapters],
	);

	useEffect(() => {
		if (!isAppInitialized) {
			return;
		}
		if (!structuredChapters.length) {
			return;
		}
		setExpandedChapters((current) => {
			let changed = false;
			const next = { ...current };
			structuredChapters.forEach((chapter) => {
				if (next[chapter.id] == null) {
					next[chapter.id] = false;
					changed = true;
				}
			});
			return changed ? next : current;
		});
	}, [structuredChapters, setExpandedChapters, isAppInitialized]);

	return {
		expand,
		toggle,
		expandedChapters,
	};
};
