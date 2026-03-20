import type { ChapterOutline, SceneOutline, WorkOutline } from "@shared/types";
import { atom } from "jotai";
import { selectedSceneAtom } from "../editor/store";
import { getWorkOutline } from "./commands";

export const outlineNodesAtom = atom<WorkOutline | undefined>(undefined);

export const loadOutlineNodesAtom = atom(
	null,
	async (_get, set, workId: string) => {
		const result = await getWorkOutline(workId);
		if (result.ok) {
			set(outlineNodesAtom, result.value);
		}
	},
);

export const addChapterAtom = atom(
	null,
	(_get, set, chapter: ChapterOutline) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				chapters: [...prev.chapters, chapter],
			};
		});
	},
);

export const addSceneAtom = atom(null, (_get, set, scene: SceneOutline) => {
	set(outlineNodesAtom, (prev) => {
		if (!prev) return prev;
		return {
			...prev,
			scenes: [...prev.scenes, scene],
		};
	});
});

export const softDeleteChapterAtom = atom(
	null,
	(_get, set, chapterId: string) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				chapters: prev.chapters.map((c) =>
					c.id === chapterId ? { ...c, is_deleted: true } : c,
				),

				scenes: prev.scenes.map((s) =>
					s.chapter_id === chapterId ? { ...s, is_deleted: true } : s,
				),
			};
		});
	},
);

export const softDeleteSceneAtom = atom(null, (_get, set, sceneId: string) => {
	set(outlineNodesAtom, (prev) => {
		if (!prev) return prev;
		return {
			...prev,
			scenes: prev.scenes.map((s) =>
				s.id === sceneId ? { ...s, is_deleted: true } : s,
			),
		};
	});
});

export const updateChapterTitleAtom = atom(
	null,
	(_get, set, { chapterId, title }: { chapterId: string; title: string }) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				chapters: prev.chapters.map((c) =>
					c.id === chapterId ? { ...c, title } : c,
				),
			};
		});
	},
);

export const updateSceneTitleAtom = atom(
	null,
	(get, set, { sceneId, title }: { sceneId: string; title: string }) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				scenes: prev.scenes.map((s) =>
					s.id === sceneId ? { ...s, title } : s,
				),
			};
		});

		const selectedScene = get(selectedSceneAtom);
		if (selectedScene?.id === sceneId) {
			set(selectedSceneAtom, { ...selectedScene, title });
		}
	},
);

export const restoreChapterAtom = atom(null, (_get, set, chapterId: string) => {
	set(outlineNodesAtom, (prev) => {
		if (!prev) return prev;
		return {
			...prev,
			chapters: prev.chapters.map((c) =>
				c.id === chapterId ? { ...c, is_deleted: false } : c,
			),

			scenes: prev.scenes.map((s) =>
				s.chapter_id === chapterId ? { ...s, is_deleted: false } : s,
			),
		};
	});
});

export const restoreSceneAtom = atom(null, (_get, set, sceneId: string) => {
	set(outlineNodesAtom, (prev) => {
		if (!prev) return prev;
		return {
			...prev,
			scenes: prev.scenes.map((s) =>
				s.id === sceneId ? { ...s, is_deleted: false } : s,
			),
		};
	});
});

export const permanentDeleteChapterAtom = atom(
	null,
	(_get, set, chapterId: string) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				chapters: prev.chapters.filter((c) => c.id !== chapterId),

				scenes: prev.scenes.filter((s) => s.chapter_id !== chapterId),
			};
		});
	},
);

export const permanentDeleteSceneAtom = atom(
	null,
	(_get, set, sceneId: string) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				scenes: prev.scenes.filter((s) => s.id !== sceneId),
			};
		});
	},
);

export const editingNodeIdAtom = atom<{
	id: string;
	type: "chapter" | "scene";
} | null>(null);

export const chapterToExpandAtom = atom<string | null>(null);

export const expandedChaptersAtom = atom<Record<string, boolean>>({});

export const initializeOutlineAtom = atom(
	null,
	(
		_get,
		set,
		data: {
			outline: WorkOutline;
			expandedChapters: Record<string, boolean>;
		},
	) => {
		set(outlineNodesAtom, data.outline);
		set(expandedChaptersAtom, data.expandedChapters);
	},
);

export const draggingNodeAtom = atom<{
	type: "chapter" | "scene" | null;
	id: string | null;
}>({
	type: null,
	id: null,
});

export const addingNodeAtom = atom<{
	type: "chapter" | "scene";
	chapterId?: string;
} | null>(null);

export const reorderSceneAtom = atom(
	null,
	(
		_get,
		set,
		{
			sceneId,
			chapterId,
			newIndex,
		}: { sceneId: string; chapterId: string; newIndex: number },
	) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;

			const chapterScenes = prev.scenes
				.filter((s) => s.chapter_id === chapterId && !s.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order);

			const oldIndex = chapterScenes.findIndex((s) => s.id === sceneId);
			if (oldIndex === -1) return prev;

			const [movedScene] = chapterScenes.splice(oldIndex, 1);
			chapterScenes.splice(newIndex, 0, movedScene);

			const newSortOrders = new Map<string, number>();
			chapterScenes.forEach((s, index) => {
				newSortOrders.set(s.id, index);
			});

			return {
				...prev,
				scenes: prev.scenes.map((s) => {
					const newSortOrder = newSortOrders.get(s.id);
					if (newSortOrder !== undefined) {
						return { ...s, sort_order: newSortOrder };
					}
					return s;
				}),
			};
		});
	},
);

export const updateSceneWordCountAtom = atom(
	null,
	(
		_get,
		set,
		{ sceneId, wordCount }: { sceneId: string; wordCount: number },
	) => {
		set(outlineNodesAtom, (prev) => {
			if (!prev) return prev;
			return {
				...prev,
				scenes: prev.scenes.map((s) =>
					s.id === sceneId ? { ...s, word_count: wordCount } : s,
				),
			};
		});
	},
);
