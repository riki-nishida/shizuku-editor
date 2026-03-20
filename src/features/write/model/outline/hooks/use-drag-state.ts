import { useAtomValue } from "jotai";
import { draggingNodeAtom } from "../store";

type DragState = {
	isDraggingChapter: boolean;

	isDraggingScene: boolean;

	draggingId: string | null;

	draggingType: "chapter" | "scene" | null;
};

export const useDragState = (): DragState => {
	const draggingNode = useAtomValue(draggingNodeAtom);

	return {
		isDraggingChapter: draggingNode.type === "chapter",
		isDraggingScene: draggingNode.type === "scene",
		draggingId: draggingNode.id,
		draggingType: draggingNode.type,
	};
};
