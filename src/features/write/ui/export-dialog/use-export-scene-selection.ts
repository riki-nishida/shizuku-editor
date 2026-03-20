import type { ChapterOutline, SceneOutline } from "@shared/types";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { outlineNodesAtom } from "../../model/outline/store";

export type ChapterWithScenes = ChapterOutline & { scenes: SceneOutline[] };

export const useExportSceneSelection = (isOpen: boolean) => {
	const nodes = useAtomValue(outlineNodesAtom);

	const chapters = useMemo((): ChapterWithScenes[] => {
		if (!nodes) return [];

		const activeChapters = nodes.chapters
			.filter((ch) => !ch.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);

		const activeScenes = nodes.scenes
			.filter((s) => !s.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);

		const scenesByChapter = new Map<string, SceneOutline[]>();
		for (const scene of activeScenes) {
			const list = scenesByChapter.get(scene.chapter_id) ?? [];
			list.push(scene);
			scenesByChapter.set(scene.chapter_id, list);
		}

		return activeChapters.map((chapter) => ({
			...chapter,
			scenes: scenesByChapter.get(chapter.id) ?? [],
		}));
	}, [nodes]);

	const allSceneIds = useMemo(
		() => new Set(chapters.flatMap((ch) => ch.scenes.map((s) => s.id))),
		[chapters],
	);

	const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(
		new Set(),
	);

	const [expandedChapters, setExpandedChapters] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		if (isOpen) {
			setSelectedSceneIds(new Set(allSceneIds));
			const expanded: Record<string, boolean> = {};
			for (const ch of chapters) {
				expanded[ch.id] = true;
			}
			setExpandedChapters(expanded);
		}
	}, [isOpen, allSceneIds, chapters]);

	const toggleScene = useCallback((sceneId: string) => {
		setSelectedSceneIds((prev) => {
			const next = new Set(prev);
			if (next.has(sceneId)) {
				next.delete(sceneId);
			} else {
				next.add(sceneId);
			}
			return next;
		});
	}, []);

	const toggleChapter = useCallback(
		(chapterId: string) => {
			const chapter = chapters.find((ch) => ch.id === chapterId);
			if (!chapter) return;

			const chapterSceneIds = chapter.scenes.map((s) => s.id);
			const allSelected = chapterSceneIds.every((id) =>
				selectedSceneIds.has(id),
			);

			setSelectedSceneIds((prev) => {
				const next = new Set(prev);
				if (allSelected) {
					for (const id of chapterSceneIds) {
						next.delete(id);
					}
				} else {
					for (const id of chapterSceneIds) {
						next.add(id);
					}
				}
				return next;
			});
		},
		[chapters, selectedSceneIds],
	);

	const selectAll = useCallback(() => {
		setSelectedSceneIds(new Set(allSceneIds));
	}, [allSceneIds]);

	const deselectAll = useCallback(() => {
		setSelectedSceneIds(new Set());
	}, []);

	const getChapterCheckedState = useCallback(
		(chapterId: string): boolean | "indeterminate" => {
			const chapter = chapters.find((ch) => ch.id === chapterId);
			if (!chapter || chapter.scenes.length === 0) return false;

			const chapterSceneIds = chapter.scenes.map((s) => s.id);
			const selectedCount = chapterSceneIds.filter((id) =>
				selectedSceneIds.has(id),
			).length;

			if (selectedCount === 0) return false;
			if (selectedCount === chapterSceneIds.length) return true;
			return "indeterminate";
		},
		[chapters, selectedSceneIds],
	);

	const allCheckedState = useMemo((): boolean | "indeterminate" => {
		if (allSceneIds.size === 0) return false;
		if (selectedSceneIds.size === 0) return false;
		if (selectedSceneIds.size === allSceneIds.size) return true;
		return "indeterminate";
	}, [allSceneIds, selectedSceneIds]);

	const toggleExpanded = useCallback((chapterId: string) => {
		setExpandedChapters((prev) => ({
			...prev,
			[chapterId]: !prev[chapterId],
		}));
	}, []);

	const selectedChapterIds = useMemo(() => {
		const ids = new Set<string>();
		for (const ch of chapters) {
			if (ch.scenes.some((s) => selectedSceneIds.has(s.id))) {
				ids.add(ch.id);
			}
		}
		return Array.from(ids);
	}, [chapters, selectedSceneIds]);

	const chapterCount = selectedChapterIds.length;
	const sceneCount = selectedSceneIds.size;
	const totalWordCount = useMemo(() => {
		let sum = 0;
		for (const ch of chapters) {
			for (const s of ch.scenes) {
				if (selectedSceneIds.has(s.id)) {
					sum += s.word_count;
				}
			}
		}
		return sum;
	}, [chapters, selectedSceneIds]);

	return {
		chapters,
		selectedSceneIds,
		selectedChapterIds,
		chapterCount,
		sceneCount,
		totalWordCount,
		allCheckedState,
		expandedChapters,
		toggleScene,
		toggleChapter,
		selectAll,
		deselectAll,
		getChapterCheckedState,
		toggleExpanded,
	};
};
