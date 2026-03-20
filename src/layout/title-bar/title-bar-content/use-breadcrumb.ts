import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import {
	outlineNodesAtom,
	updateChapterTitleAtom,
	updateSceneTitleAtom,
} from "@features/write";
import {
	updateChapterTitle,
	updateSceneTitle,
} from "@features/write/model/editor/commands";
import type { BreadcrumbItem } from "@shared/ui/breadcrumb";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";

export const useBreadcrumb = () => {
	const selectedWork = useAtomValue(selectedWorkAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const outlineNodes = useAtomValue(outlineNodesAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const updateChapterTitleInOutline = useSetAtom(updateChapterTitleAtom);
	const updateSceneTitleInOutline = useSetAtom(updateSceneTitleAtom);

	const handleChapterTitleEdit = useCallback(
		async (chapterId: string, newTitle: string) => {
			const result = await updateChapterTitle(chapterId, newTitle);
			if (result.ok) {
				updateChapterTitleInOutline({ chapterId, title: newTitle });
			}
		},
		[updateChapterTitleInOutline],
	);

	const handleSceneTitleEdit = useCallback(
		async (sceneId: string, newTitle: string) => {
			const result = await updateSceneTitle(sceneId, newTitle);
			if (result.ok) {
				updateSceneTitleInOutline({ sceneId, title: newTitle });
			}
		},
		[updateSceneTitleInOutline],
	);

	return useMemo((): BreadcrumbItem[] => {
		if (!selectedWork) {
			return [];
		}

		const items: BreadcrumbItem[] = [
			{
				id: selectedWork.id,
				label: selectedWork.name,
				type: "work",
			},
		];

		if (!outlineNodes || !selectedNode) {
			return items;
		}

		if (selectedNode.type === "scene") {
			const scene = outlineNodes.scenes.find((s) => s.id === selectedNode.id);
			if (scene && !scene.is_deleted) {
				const chapter = outlineNodes.chapters.find(
					(c) => c.id === scene.chapter_id,
				);
				if (chapter && !chapter.is_deleted) {
					items.push({
						id: chapter.id,
						label: chapter.title,
						type: "chapter",
						onClick: () => setSelectedNode({ id: chapter.id, type: "chapter" }),
						onEdit: (newTitle) =>
							void handleChapterTitleEdit(chapter.id, newTitle),
					});
				}
				items.push({
					id: scene.id,
					label: scene.title,
					type: "scene",
					onEdit: (newTitle) => void handleSceneTitleEdit(scene.id, newTitle),
				});
			}
		} else if (selectedNode.type === "chapter") {
			const chapter = outlineNodes.chapters.find(
				(c) => c.id === selectedNode.id,
			);
			if (chapter && !chapter.is_deleted) {
				items.push({
					id: chapter.id,
					label: chapter.title,
					type: "chapter",
					onEdit: (newTitle) =>
						void handleChapterTitleEdit(chapter.id, newTitle),
				});
			}
		}

		return items;
	}, [
		selectedWork,
		selectedNode,
		outlineNodes,
		setSelectedNode,
		handleChapterTitleEdit,
		handleSceneTitleEdit,
	]);
};
