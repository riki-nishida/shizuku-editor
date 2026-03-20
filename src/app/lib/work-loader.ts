import {
	getKnowledgeByWork,
	getKnowledgeTypesByWork,
} from "@features/knowledge";
import type { SelectedNode } from "@features/work";
import {
	getExpandedChapters,
	getSelectedNode,
} from "@features/work/model/commands";
import {
	getWorkOutline,
	getWorkStatistics,
} from "@features/write/model/outline/commands";
import { unwrapOr } from "@shared/lib/error/result";
import type {
	KnowledgeOutline,
	KnowledgeTypeOutline,
	WorkOutline,
	WorkStatistics,
} from "@shared/types";

export type WorkData = {
	outline: WorkOutline;
	selectedNode: SelectedNode;
	expandedChapters: Record<string, boolean>;
	knowledgeList: KnowledgeOutline[];
	knowledgeTypes: KnowledgeTypeOutline[];
	workStats: WorkStatistics | null;
};

export const loadWorkData = async (workId: string): Promise<WorkData> => {
	const [
		outlineResult,
		savedNodeResult,
		savedExpandedResult,
		knowledgeListResult,
		knowledgeTypesResult,
		workStatsResult,
	] = await Promise.all([
		getWorkOutline(workId),
		getSelectedNode(workId),
		getExpandedChapters(workId),
		getKnowledgeByWork(workId),
		getKnowledgeTypesByWork(workId),
		getWorkStatistics(workId),
	]);

	const outline = unwrapOr(outlineResult, { chapters: [], scenes: [] });
	let selectedNode = unwrapOr(savedNodeResult, null);
	const expandedChapters = unwrapOr(savedExpandedResult, {});

	if (selectedNode === null) {
		if (outline.scenes.length > 0) {
			const firstScene = outline.scenes[0];
			selectedNode = { id: firstScene.id, type: "scene" };
			expandedChapters[firstScene.chapter_id] = true;
		}
	} else if (selectedNode?.type === "scene") {
		const sceneId = selectedNode.id;
		const scene = outline.scenes.find((s) => s.id === sceneId);
		if (scene) {
			expandedChapters[scene.chapter_id] = true;
		}
	}

	return {
		outline,
		selectedNode,
		expandedChapters,
		knowledgeList: unwrapOr(knowledgeListResult, []),
		knowledgeTypes: unwrapOr(knowledgeTypesResult, []),
		workStats: unwrapOr(workStatsResult, null),
	};
};
