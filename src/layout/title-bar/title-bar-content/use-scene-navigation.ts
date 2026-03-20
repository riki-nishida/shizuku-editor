import { selectedNodeAtom } from "@features/work";
import { outlineNodesAtom } from "@features/write";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";

export const useSceneNavigation = () => {
	const outline = useAtomValue(outlineNodesAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);

	const flatScenes = useMemo(() => {
		if (!outline) return [];
		const activeChapters = outline.chapters
			.filter((c) => !c.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);

		return activeChapters.flatMap((chapter) =>
			outline.scenes
				.filter((s) => s.chapter_id === chapter.id && !s.is_deleted)
				.sort((a, b) => a.sort_order - b.sort_order),
		);
	}, [outline]);

	const currentIndex = useMemo(() => {
		if (!selectedNode || selectedNode.type !== "scene") return -1;
		return flatScenes.findIndex((s) => s.id === selectedNode.id);
	}, [flatScenes, selectedNode]);

	const canGoPrev = currentIndex > 0;
	const canGoNext = currentIndex >= 0 && currentIndex < flatScenes.length - 1;

	const goPrev = () => {
		if (canGoPrev) {
			setSelectedNode({ type: "scene", id: flatScenes[currentIndex - 1].id });
		}
	};

	const goNext = () => {
		if (canGoNext) {
			setSelectedNode({ type: "scene", id: flatScenes[currentIndex + 1].id });
		}
	};

	return { canGoPrev, canGoNext, goPrev, goNext };
};
