import { selectedNodeAtom } from "@features/work";
import { showConfirmDialog } from "@shared/lib/dialog";
import { Redo, XmarkCircle } from "iconoir-react";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import {
	permanentDeleteChapter,
	permanentDeleteScene,
	restoreChapter,
	restoreScene,
} from "../../../../model/editor";
import {
	permanentDeleteChapterAtom,
	permanentDeleteSceneAtom,
	restoreChapterAtom,
	restoreSceneAtom,
} from "../../../../model/outline/store";

type NodeType = "chapter" | "scene";

type UseTrashNodeContextMenuProps = {
	id: string;
	type: NodeType;
	title: string;
};

export const useTrashNodeContextMenu = ({
	id,
	type,
	title,
}: UseTrashNodeContextMenuProps) => {
	const { t } = useTranslation();
	const restoreChapterStore = useSetAtom(restoreChapterAtom);
	const restoreSceneStore = useSetAtom(restoreSceneAtom);
	const permanentDeleteChapterStore = useSetAtom(permanentDeleteChapterAtom);
	const permanentDeleteSceneStore = useSetAtom(permanentDeleteSceneAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);

	const contextMenuItems = [
		{
			value: "restore",
			label: t("outline.restoreTooltip"),
			icon: <Redo width={16} height={16} strokeWidth={2} />,
		},
		{
			value: "separator",
			label: "",
			separator: true,
		},
		{
			value: "permanent-delete",
			label: t("outline.permanentDelete"),
			icon: <XmarkCircle width={16} height={16} strokeWidth={2} />,
			destructive: true,
		},
	];

	const handleContextMenuSelect = async (details: { value: string }) => {
		switch (details.value) {
			case "restore":
				if (type === "chapter") {
					await restoreChapter(id);
					restoreChapterStore(id);
				} else {
					await restoreScene(id);
					restoreSceneStore(id);
				}
				setSelectedNode({ id, type });
				break;
			case "permanent-delete": {
				const confirmed = await showConfirmDialog(
					t("outline.permanentDeleteConfirm", { title }),
					{ kind: "warning" },
				);
				if (!confirmed) {
					return;
				}
				setSelectedNode(null);
				if (type === "chapter") {
					await permanentDeleteChapter(id);
					permanentDeleteChapterStore(id);
				} else {
					await permanentDeleteScene(id);
					permanentDeleteSceneStore(id);
				}
				break;
			}
		}
	};

	return {
		contextMenuItems,
		handleContextMenuSelect,
	};
};
