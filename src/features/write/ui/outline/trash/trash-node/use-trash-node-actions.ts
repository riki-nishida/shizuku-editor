import { selectedNodeAtom } from "@features/work";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
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

type UseTrashNodeActionsProps = {
	id: string;
	type: NodeType;
	title: string;
};

export const useTrashNodeActions = ({
	id,
	type,
	title,
}: UseTrashNodeActionsProps) => {
	const { t } = useTranslation();
	const restoreChapterStore = useSetAtom(restoreChapterAtom);
	const restoreSceneStore = useSetAtom(restoreSceneAtom);
	const permanentDeleteChapterStore = useSetAtom(permanentDeleteChapterAtom);
	const permanentDeleteSceneStore = useSetAtom(permanentDeleteSceneAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);

	const handleRestore = useCallback(async () => {
		if (type === "chapter") {
			await restoreChapter(id);
			restoreChapterStore(id);
		} else {
			await restoreScene(id);
			restoreSceneStore(id);
		}
		setSelectedNode({ id, type });
	}, [id, type, restoreChapterStore, restoreSceneStore, setSelectedNode]);

	const handlePermanentDelete = useCallback(async () => {
		const confirmed = await showConfirmDialog(
			t("outline.permanentDeleteConfirm", { title }),
			{ kind: "warning" },
		);
		if (!confirmed) return;

		setSelectedNode(null);
		if (type === "chapter") {
			await permanentDeleteChapter(id);
			permanentDeleteChapterStore(id);
		} else {
			await permanentDeleteScene(id);
			permanentDeleteSceneStore(id);
		}
	}, [
		id,
		type,
		title,
		permanentDeleteChapterStore,
		permanentDeleteSceneStore,
		setSelectedNode,
		t,
	]);

	return { handleRestore, handlePermanentDelete };
};
