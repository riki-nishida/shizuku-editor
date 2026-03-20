import { selectedNodeAtom } from "@features/work";
import { EditPencil, Trash } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { deleteChapter, deleteScene } from "../../../../model/editor";
import {
	editingNodeIdAtom,
	softDeleteChapterAtom,
	softDeleteSceneAtom,
} from "../../../../model/outline/store";

type NodeType = "chapter" | "scene";

type UseOutlineNodeContextMenuProps = {
	id: string;
	type: NodeType;
};

export const useOutlineNodeContextMenu = ({
	id,
	type,
}: UseOutlineNodeContextMenuProps) => {
	const { t } = useTranslation();
	const editingNodeId = useAtomValue(editingNodeIdAtom);
	const setEditingNodeId = useSetAtom(editingNodeIdAtom);
	const softDeleteChapter = useSetAtom(softDeleteChapterAtom);
	const softDeleteScene = useSetAtom(softDeleteSceneAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);

	const startEditing = editingNodeId?.id === id && editingNodeId?.type === type;

	const contextMenuItems = [
		{
			value: "rename",
			label: t("outline.rename"),
			icon: <EditPencil width={16} height={16} strokeWidth={2} />,
		},
		{
			value: "separator-1",
			label: "",
			separator: true,
		},
		{
			value: "delete",
			label: t("outline.moveToTrash"),
			icon: <Trash width={16} height={16} strokeWidth={2} />,
		},
	];

	const handleContextMenuSelect = async (details: { value: string }) => {
		switch (details.value) {
			case "rename":
				setEditingNodeId({ id, type });
				break;
			case "delete":
				if (type === "chapter") {
					await deleteChapter(id);
					softDeleteChapter(id);
				} else {
					await deleteScene(id);
					softDeleteScene(id);
				}
				setSelectedNode(null);
				break;
		}
	};

	const handleEditComplete = () => {
		setEditingNodeId(null);
	};

	return {
		startEditing,
		contextMenuItems,
		handleContextMenuSelect,
		handleEditComplete,
	};
};
