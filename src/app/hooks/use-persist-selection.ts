import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import {
	saveExpandedChapters,
	saveSelectedNode,
} from "@features/work/model/commands";
import { expandedChaptersAtom } from "@features/write/model/outline/store";
import { appInitializedAtom } from "@shared/store/ui";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

export const usePersistSelection = () => {
	const selectedWork = useAtomValue(selectedWorkAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const expandedChapters = useAtomValue(expandedChaptersAtom);
	const isInitialized = useAtomValue(appInitializedAtom);

	const hasNodeChangedAfterInit = useRef(false);
	const hasExpandedChangedAfterInit = useRef(false);
	const prevWorkIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (selectedWork?.id !== prevWorkIdRef.current) {
			hasNodeChangedAfterInit.current = false;
			hasExpandedChangedAfterInit.current = false;
			prevWorkIdRef.current = selectedWork?.id ?? null;
		}
	}, [selectedWork?.id]);

	useEffect(() => {
		if (!isInitialized || !selectedWork) return;

		if (!hasNodeChangedAfterInit.current) {
			hasNodeChangedAfterInit.current = true;
			return;
		}

		void saveSelectedNode(selectedWork.id, selectedNode);
	}, [selectedNode, isInitialized, selectedWork]);

	useEffect(() => {
		if (!isInitialized || !selectedWork) return;

		if (!hasExpandedChangedAfterInit.current) {
			hasExpandedChangedAfterInit.current = true;
			return;
		}

		void saveExpandedChapters(selectedWork.id, expandedChapters);
	}, [expandedChapters, isInitialized, selectedWork]);
};
