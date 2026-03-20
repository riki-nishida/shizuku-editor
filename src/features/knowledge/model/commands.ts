import { invokeCommand } from "@shared/lib/commands";
import type {
	Knowledge,
	KnowledgeOutline,
	KnowledgeSearchResult,
	KnowledgeTypeOutline,
} from "@shared/types";

export const getKnowledge = (knowledgeId: string) => {
	return invokeCommand<Knowledge>("get_knowledge", { knowledgeId });
};

export const getKnowledgeByWork = (workId: string) => {
	return invokeCommand<KnowledgeOutline[]>("get_knowledge_by_work", {
		workId,
	});
};

export const createKnowledge = (typeId: string, title: string) => {
	return invokeCommand<string>("create_knowledge", { typeId, title });
};

export const updateKnowledgeTitle = (knowledgeId: string, title: string) => {
	return invokeCommand<void>("update_knowledge_title", { knowledgeId, title });
};

export const updateKnowledgeBody = (
	knowledgeId: string,
	body: string,
	plainText: string,
) => {
	return invokeCommand<void>("update_knowledge_body", {
		knowledgeId,
		body,
		plainText,
	});
};

export const updateKnowledgeTypeId = (knowledgeId: string, typeId: string) => {
	return invokeCommand<void>("update_knowledge_type_id", {
		knowledgeId,
		typeId,
	});
};

export const updateKnowledgeSortOrder = (
	knowledgeId: string,
	newSortOrder: number,
) => {
	return invokeCommand<void>("update_knowledge_sort_order", {
		knowledgeId,
		newSortOrder,
	});
};

export const deleteKnowledge = (knowledgeId: string) => {
	return invokeCommand<void>("delete_knowledge", { knowledgeId });
};

export const searchKnowledge = (workId: string, query: string) => {
	return invokeCommand<KnowledgeSearchResult[]>("search_knowledge", {
		workId,
		query,
	});
};

export const getKnowledgeTypesByWork = (workId: string) => {
	return invokeCommand<KnowledgeTypeOutline[]>("get_knowledge_types_by_work", {
		workId,
	});
};

export const createKnowledgeType = (
	workId: string,
	name: string,
	color?: string,
	icon?: string,
) => {
	return invokeCommand<string>("create_knowledge_type", {
		workId,
		name,
		color,
		icon,
	});
};

export const updateKnowledgeType = (
	typeId: string,
	name?: string,
	color?: string,
	icon?: string,
	sortOrder?: number,
) => {
	return invokeCommand<void>("update_knowledge_type", {
		typeId,
		name,
		color,
		icon,
		sortOrder,
	});
};

export const updateKnowledgeTypeSortOrder = (
	typeId: string,
	newSortOrder: number,
) => {
	return invokeCommand<void>("update_knowledge_type_sort_order", {
		typeId,
		newSortOrder,
	});
};

export const deleteKnowledgeType = (typeId: string) => {
	return invokeCommand<void>("delete_knowledge_type", { typeId });
};
