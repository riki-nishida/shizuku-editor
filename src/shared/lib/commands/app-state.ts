import { invokeCommand } from "./index";

export const getPanelSizes = () => {
	return invokeCommand<number[]>("get_panel_sizes");
};

export const savePanelSizes = (sizes: number[]) => {
	return invokeCommand<void>("save_panel_sizes", { sizes });
};

export const getInspectorCollapsed = () => {
	return invokeCommand<boolean>("get_inspector_collapsed");
};

export const saveInspectorCollapsed = (collapsed: boolean) => {
	return invokeCommand<void>("save_inspector_collapsed", { collapsed });
};

export const getSplitViewDirection = () => {
	return invokeCommand<string>("get_split_view_direction");
};

export const saveSplitViewDirection = (direction: string) => {
	return invokeCommand<void>("save_split_view_direction", { direction });
};

export const getSplitViewRatio = () => {
	return invokeCommand<number>("get_split_view_ratio");
};

export const saveSplitViewRatio = (ratio: number) => {
	return invokeCommand<void>("save_split_view_ratio", { ratio });
};

export type SplitViewPanes = {
	primarySceneId: string | null;
	secondarySceneId: string | null;
};

export const getSplitViewPanes = () => {
	return invokeCommand<SplitViewPanes>("get_split_view_panes");
};

export const saveSplitViewPanes = (panes: SplitViewPanes) => {
	return invokeCommand<void>("save_split_view_panes", { panes });
};

export type SidebarSections = {
	outline: boolean;
	materials: boolean;
};

export const getSidebarSections = () => {
	return invokeCommand<SidebarSections>("get_sidebar_sections");
};

export const saveSidebarSections = (sections: SidebarSections) => {
	return invokeCommand<void>("save_sidebar_sections", { sections });
};

export const getSidebarSectionRatio = () => {
	return invokeCommand<number>("get_sidebar_section_ratio");
};

export const saveSidebarSectionRatio = (ratio: number) => {
	return invokeCommand<void>("save_sidebar_section_ratio", { ratio });
};
