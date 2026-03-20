import { selectedNodeAtom } from "@features/work";
import { outlineNodesAtom } from "@features/write/model/outline/store";
import { inspectorCollapsedAtom } from "@shared/store/ui";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

export const usePanelVisibility = () => {
	const selectedNode = useAtomValue(selectedNodeAtom);
	const outline = useAtomValue(outlineNodesAtom);
	const inspectorCollapsed = useAtomValue(inspectorCollapsedAtom);

	const isSelectedSceneDeleted = useMemo(() => {
		if (selectedNode?.type !== "scene" || !outline) return false;
		const scene = outline.scenes.find((s) => s.id === selectedNode.id);
		return scene?.is_deleted === true;
	}, [selectedNode, outline]);

	const showSidebar = true;

	const showInspector =
		selectedNode?.type === "scene" && !isSelectedSceneDeleted;

	return { showSidebar, showInspector, inspectorCollapsed };
};
