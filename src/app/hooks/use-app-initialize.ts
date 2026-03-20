import { loadWorkData } from "@app/lib/work-loader";
import { knowledgeListAtom, knowledgeTypesAtom } from "@features/knowledge";
import { loadSettingsAtom } from "@features/settings";
import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import { getSelectedWorkId, listWorks } from "@features/work/model";
import { workStatsAtom } from "@features/write";
import {
	expandedChaptersAtom,
	outlineNodesAtom,
} from "@features/write/model/outline/store";
import { unwrapOr } from "@shared/lib/error/result";
import {
	loadSidebarSectionRatioAtom,
	loadSidebarSectionsAtom,
} from "@shared/store/sidebar";
import { loadSplitViewStateAtom } from "@shared/store/split-view";
import {
	appInitializedAtom,
	loadInspectorCollapsedAtom,
	loadPanelSizesAtom,
} from "@shared/store/ui";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

export const useAppInitialize = () => {
	const loadSettings = useSetAtom(loadSettingsAtom);
	const loadPanelSizes = useSetAtom(loadPanelSizesAtom);
	const loadInspectorCollapsed = useSetAtom(loadInspectorCollapsedAtom);
	const loadSplitViewState = useSetAtom(loadSplitViewStateAtom);
	const loadSidebarSections = useSetAtom(loadSidebarSectionsAtom);
	const loadSidebarSectionRatio = useSetAtom(loadSidebarSectionRatioAtom);
	const setSelectedWork = useSetAtom(selectedWorkAtom);
	const setOutlineNodes = useSetAtom(outlineNodesAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const setExpandedChapters = useSetAtom(expandedChaptersAtom);
	const setKnowledgeList = useSetAtom(knowledgeListAtom);
	const setKnowledgeTypes = useSetAtom(knowledgeTypesAtom);
	const setWorkStats = useSetAtom(workStatsAtom);
	const setAppInitialized = useSetAtom(appInitializedAtom);
	const isInitialized = useAtomValue(appInitializedAtom);
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;

		const initialize = async () => {
			await Promise.all([
				loadSettings(),
				loadPanelSizes(),
				loadInspectorCollapsed(),
				loadSplitViewState(),
				loadSidebarSections(),
				loadSidebarSectionRatio(),
			]);

			const worksResult = await listWorks();
			const works = unwrapOr(worksResult, []);

			if (works.length > 0) {
				const savedIdResult = await getSelectedWorkId();
				const savedId = unwrapOr(savedIdResult, null);

				const target =
					(savedId != null && works.find((w) => w.id === savedId)) || works[0];

				if (target) {
					const data = await loadWorkData(target.id);

					setOutlineNodes(data.outline);
					setSelectedNode(data.selectedNode);
					setExpandedChapters(data.expandedChapters);
					setKnowledgeList(data.knowledgeList);
					setKnowledgeTypes(data.knowledgeTypes);
					setWorkStats(data.workStats);

					setSelectedWork(target);
				}
			}

			setAppInitialized(true);
		};

		void initialize();
	}, [
		loadSettings,
		loadPanelSizes,
		loadInspectorCollapsed,
		loadSplitViewState,
		loadSidebarSections,
		loadSidebarSectionRatio,
		setSelectedWork,
		setOutlineNodes,
		setSelectedNode,
		setExpandedChapters,
		setKnowledgeList,
		setKnowledgeTypes,
		setWorkStats,
		setAppInitialized,
	]);

	return { isInitialized };
};
