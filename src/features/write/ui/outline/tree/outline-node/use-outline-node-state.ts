import { selectedNodeAtom } from "@features/work";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useOutlineNodeContextMenu } from "./use-outline-node-context-menu";

type Params = {
	id: string;
	type: "chapter" | "scene";
};

export const useOutlineNodeState = ({ id, type }: Params) => {
	const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
	const [isEditing, setIsEditing] = useState(false);

	const {
		startEditing,
		contextMenuItems,
		handleContextMenuSelect,
		handleEditComplete,
	} = useOutlineNodeContextMenu({ id, type });

	const isActive = selectedNode?.id === id && selectedNode?.type === type;

	const select = () => {
		setSelectedNode({ id, type });
	};

	const onEditComplete = () => {
		setIsEditing(false);
		handleEditComplete();
	};

	useEffect(() => {
		if (startEditing) {
			setIsEditing(true);
		}
	}, [startEditing]);

	return {
		isActive,
		isEditing,
		select,
		onEditComplete,
		contextMenuItems,
		handleContextMenuSelect,
	};
};
