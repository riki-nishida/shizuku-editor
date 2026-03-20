import { invokeCommand } from "@shared/lib/commands";

export type InspectorSections = Record<string, boolean>;

export const getInspectorSections = () => {
	return invokeCommand<InspectorSections>("get_inspector_sections");
};

export const saveInspectorSections = (sections: InspectorSections) => {
	return invokeCommand<void>("save_inspector_sections", { sections });
};

export const getInspectorTab = () => {
	return invokeCommand<string>("get_inspector_tab");
};

export const saveInspectorTab = (tab: string) => {
	return invokeCommand<void>("save_inspector_tab", { tab });
};
