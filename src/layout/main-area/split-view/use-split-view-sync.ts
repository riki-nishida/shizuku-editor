import { selectedNodeAtom } from "@features/work";
import { loadSelectedSceneAtom } from "@features/write/model/editor/store";
import { searchPanelOpenAtom } from "@shared/store";
import {
	activePaneAtom,
	isSplitActiveAtom,
	openInActivePaneAtom,
	primaryPaneContentAtom,
	secondaryPaneContentAtom,
} from "@shared/store/split-view";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

export const useSplitViewSync = () => {
	const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
	const isSplitActive = useAtomValue(isSplitActiveAtom);
	const activePane = useAtomValue(activePaneAtom);
	const primaryContent = useAtomValue(primaryPaneContentAtom);
	const secondaryContent = useAtomValue(secondaryPaneContentAtom);
	const openInActivePane = useSetAtom(openInActivePaneAtom);
	const loadSelectedScene = useSetAtom(loadSelectedSceneAtom);
	const setSearchPanelOpen = useSetAtom(searchPanelOpenAtom);

	const isFromSidebarRef = useRef(false);
	const prevActivePaneRef = useRef(activePane);
	const prevIsSplitActiveRef = useRef(isSplitActive);

	useEffect(() => {
		const wasJustEnabled = !prevIsSplitActiveRef.current && isSplitActive;
		prevIsSplitActiveRef.current = isSplitActive;

		if (!isSplitActive || !selectedNode) {
			return;
		}

		if (wasJustEnabled) {
			return;
		}

		isFromSidebarRef.current = true;

		if (selectedNode.type === "scene") {
			openInActivePane({ type: "scene", sceneId: selectedNode.id });
		}
	}, [selectedNode, isSplitActive, openInActivePane]);

	useEffect(() => {
		if (!isSplitActive) {
			prevActivePaneRef.current = activePane;
			return;
		}

		const paneChanged = prevActivePaneRef.current !== activePane;
		const activeContent =
			activePane === "primary" ? primaryContent : secondaryContent;

		if (activeContent.type === "scene") {
			loadSelectedScene(activeContent.sceneId);

			if (isFromSidebarRef.current) {
				isFromSidebarRef.current = false;
			} else if (paneChanged) {
				setSelectedNode({ type: "scene", id: activeContent.sceneId });
			}
		}

		if (paneChanged) {
			setSearchPanelOpen(false);
		}

		prevActivePaneRef.current = activePane;
	}, [
		isSplitActive,
		activePane,
		primaryContent,
		secondaryContent,
		loadSelectedScene,
		setSelectedNode,
		setSearchPanelOpen,
	]);
};
