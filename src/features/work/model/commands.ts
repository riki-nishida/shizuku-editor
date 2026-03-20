import type { SelectedNode } from "@features/work";
import { invokeCommand } from "@shared/lib/commands";
import type { Work } from "./types";

export const listWorks = () => {
	return invokeCommand<Work[]>("list_works");
};

export const createWork = (name: string) => {
	return invokeCommand<string>("create_work", { name });
};

export const deleteWork = (workId: string) => {
	return invokeCommand<void>("delete_work", { workId });
};

export const updateWorkName = (workId: string, name: string) => {
	return invokeCommand<void>("update_work_name", { workId, name });
};

export const getSelectedWorkId = () => {
	return invokeCommand<string | null>("get_selected_work_id");
};

export const saveSelectedWorkId = (workId: string) => {
	return invokeCommand<void>("save_selected_work_id", { workId });
};

export const clearSelectedWorkId = () => {
	return invokeCommand<void>("clear_selected_work_id");
};

export const getSelectedNode = (workId: string) => {
	return invokeCommand<SelectedNode>("get_selected_node", { workId });
};

export const saveSelectedNode = (workId: string, node: SelectedNode) => {
	return invokeCommand<void>("save_selected_node", { workId, node });
};

export const getExpandedChapters = (workId: string) => {
	return invokeCommand<Record<string, boolean>>("get_expanded_chapters", {
		workId,
	});
};

export const deleteWorkUiState = (workId: string) => {
	return invokeCommand<void>("delete_work_ui_state", { workId });
};

export const saveExpandedChapters = (
	workId: string,
	expanded: Record<string, boolean>,
) => {
	return invokeCommand<void>("save_expanded_chapters", { workId, expanded });
};
