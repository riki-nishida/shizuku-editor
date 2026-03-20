import { selectedWorkAtom } from "@features/work";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { loadOutlineNodesAtom, outlineNodesAtom } from "../store";

export const useOutlineNodes = (workId: string | null) => {
	const [nodes, setNodes] = useAtom(outlineNodesAtom);
	const loadOutlineNodes = useSetAtom(loadOutlineNodesAtom);

	useEffect(() => {
		if (workId != null) {
			void loadOutlineNodes(workId);
		}
	}, [workId, loadOutlineNodes]);

	return { nodes, setNodes };
};

export const useReloadOutline = () => {
	const selectedWork = useAtomValue(selectedWorkAtom);
	const loadOutlineNodes = useSetAtom(loadOutlineNodesAtom);

	return useCallback(() => {
		if (selectedWork?.id) {
			void loadOutlineNodes(selectedWork.id);
		}
	}, [selectedWork?.id, loadOutlineNodes]);
};
