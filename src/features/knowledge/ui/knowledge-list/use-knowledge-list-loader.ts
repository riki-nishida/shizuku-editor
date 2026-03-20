import {
	createKnowledgeAtom,
	filteredKnowledgeListAtom,
	knowledgeListAtom,
	loadKnowledgeAtom,
} from "@features/knowledge/model";
import { selectedNodeAtom } from "@features/work";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

export const useKnowledgeListLoader = (workId: string | null) => {
	const knowledge = useAtomValue(filteredKnowledgeListAtom);
	const setKnowledgeList = useSetAtom(knowledgeListAtom);
	const loadKnowledge = useSetAtom(loadKnowledgeAtom);
	const createKnowledge = useSetAtom(createKnowledgeAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const selectedKnowledgeId =
		selectedNode?.type === "knowledge" ? selectedNode.id : null;
	const selectedKnowledgeIdRef = useRef(selectedKnowledgeId);
	selectedKnowledgeIdRef.current = selectedKnowledgeId;

	useEffect(() => {
		if (workId === null) return;

		setKnowledgeList(null);
		loadKnowledge(workId).then((result) => {
			if (!result.ok) {
				setSelectedNode(null);
				return;
			}
			const list = result.value;
			const currentId = selectedKnowledgeIdRef.current;
			const currentExists =
				currentId !== null && list.some((k) => k.id === currentId);

			if (!currentExists && list.length > 0) {
				setSelectedNode({ type: "knowledge", id: list[0].id });
			} else if (list.length === 0) {
				setSelectedNode({ type: "knowledge", id: null });
			}
		});
	}, [workId, setKnowledgeList, loadKnowledge, setSelectedNode]);

	const handleCreate = useCallback(
		async (title: string) => {
			if (workId === null) throw new Error("workId is null");
			const result = await createKnowledge({ title });
			if (result.ok) {
				setSelectedNode({ type: "knowledge", id: result.value });
			}
		},
		[workId, createKnowledge, setSelectedNode],
	);

	return {
		knowledge,
		handleCreate,
	};
};
