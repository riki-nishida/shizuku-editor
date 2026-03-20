import { type DragEndEvent, pointerWithin } from "@dnd-kit/core";
import { parseDndId, useDndSensors } from "@shared/lib/dnd";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { handleChapterReorder } from "../../../../model/outline/handlers/handle-chapter-reorder";
import { handleSceneReorder } from "../../../../model/outline/handlers/handle-scene-reorder";
import { handleSceneToChapterDrop } from "../../../../model/outline/handlers/handle-scene-to-chapter-drop";
import { useReloadOutline } from "../../../../model/outline/hooks/use-outline-nodes";
import {
	draggingNodeAtom,
	expandedChaptersAtom,
	outlineNodesAtom,
} from "../../../../model/outline/store";

type OutlineNodeType = "chapter" | "scene";

export const useOutlineDnd = () => {
	const [nodes, setNodes] = useAtom(outlineNodesAtom);
	const [draggingNode, setDraggingNode] = useAtom(draggingNodeAtom);
	const setExpandedChapters = useSetAtom(expandedChaptersAtom);
	const reloadOutline = useReloadOutline();
	const sensors = useDndSensors();

	const activeItem = useMemo(() => {
		if (!draggingNode.id || !draggingNode.type || !nodes) return null;

		if (draggingNode.type === "chapter") {
			const chapter = nodes.chapters.find((ch) => ch.id === draggingNode.id);
			if (!chapter) return null;

			const scenes = nodes.scenes
				.filter((s) => s.chapter_id === chapter.id && !s.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order);

			return { ...chapter, scenes };
		}

		if (draggingNode.type === "scene") {
			return nodes.scenes.find((s) => s.id === draggingNode.id);
		}

		return null;
	}, [draggingNode, nodes]);

	const handleDragStart = useCallback(
		(event: { active: { id: string | number } }) => {
			const parsed = parseDndId<OutlineNodeType>(event.active.id);
			if (parsed) {
				setDraggingNode(parsed);
			}
		},
		[setDraggingNode],
	);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setDraggingNode({ type: null, id: null });

			const { active, over } = event;
			if (!over || active.id === over.id || !nodes) {
				return;
			}

			const activeNode = parseDndId<OutlineNodeType>(active.id);
			const overNode = parseDndId<OutlineNodeType>(over.id);

			if (!activeNode || !overNode) return;

			if (activeNode.type === "scene" && overNode.type === "chapter") {
				const scene = nodes.scenes.find((s) => s.id === activeNode.id);
				const isMovingToNewChapter = scene && scene.chapter_id !== overNode.id;

				await handleSceneToChapterDrop(
					activeNode.id,
					overNode.id,
					nodes,
					setNodes,
					reloadOutline,
				);

				if (isMovingToNewChapter) {
					setExpandedChapters((prev) => ({
						...prev,
						[overNode.id]: true,
					}));
				}
				return;
			}

			if (activeNode.type === overNode.type) {
				if (activeNode.type === "chapter") {
					await handleChapterReorder(
						activeNode.id,
						overNode.id,
						nodes,
						setNodes,
						reloadOutline,
					);
				} else {
					await handleSceneReorder(
						activeNode.id,
						overNode.id,
						nodes,
						setNodes,
						reloadOutline,
					);
				}
			}
		},
		[nodes, setNodes, reloadOutline, setDraggingNode, setExpandedChapters],
	);

	return {
		sensors,
		activeItem,
		handleDragStart,
		handleDragEnd,
		collisionDetection: pointerWithin,
	};
};
