import type { WorkOutline } from "@shared/types";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { createChapter } from "../../editor/commands";
import {
	addingNodeAtom,
	chapterToExpandAtom,
	outlineNodesAtom,
} from "../store";

type UseOutlineHandlersParams = {
	workId: string | null;
	nodes: WorkOutline | undefined;
	selectedNodeId: string | null;
};

export const useOutlineHandlers = ({
	workId,
	nodes,
	selectedNodeId,
}: UseOutlineHandlersParams) => {
	const setAddingNode = useSetAtom(addingNodeAtom);
	const setChapterToExpand = useSetAtom(chapterToExpandAtom);
	const setOutlineNodes = useSetAtom(outlineNodesAtom);

	const handleAddChapter = useCallback(() => {
		if (!workId) return;
		setAddingNode({ type: "chapter" });
	}, [workId, setAddingNode]);

	const handleAddScene = useCallback(async () => {
		if (!workId || !nodes) return;

		let targetChapterId: string;

		if (selectedNodeId) {
			const selectedChapter = nodes.chapters.find(
				(c) => c.id === selectedNodeId && !c.is_deleted,
			);
			if (selectedChapter) {
				targetChapterId = selectedNodeId;
			} else {
				const selectedScene = nodes.scenes.find(
					(s) => s.id === selectedNodeId && !s.is_deleted,
				);
				if (!selectedScene) {
					return;
				}
				targetChapterId = selectedScene.chapter_id;
			}
		} else {
			const firstChapter = nodes.chapters
				.filter((c) => !c.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order)[0];

			if (!firstChapter) {
				const result = await createChapter(workId, "第一章");
				if (!result.ok) {
					return;
				}
				targetChapterId = result.value.id;

				setOutlineNodes({
					...nodes,
					chapters: [...nodes.chapters, result.value],
				});
			} else {
				targetChapterId = firstChapter.id;
			}
		}

		setChapterToExpand(targetChapterId);
		setAddingNode({ type: "scene", chapterId: targetChapterId });
	}, [
		workId,
		nodes,
		selectedNodeId,
		setAddingNode,
		setChapterToExpand,
		setOutlineNodes,
	]);

	return {
		handleAddChapter,
		handleAddScene,
	};
};
