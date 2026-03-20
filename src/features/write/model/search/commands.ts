import { invokeCommand } from "@shared/lib/commands";
import type { ProjectSearchResult, ReplaceResult } from "./types";

export const searchProject = (
	workId: string,
	query: string,
	caseSensitive: boolean,
) => {
	return invokeCommand<ProjectSearchResult>("search_project", {
		workId,
		query,
		caseSensitive,
	});
};

export const replaceInProject = (
	workId: string,
	searchText: string,
	replaceText: string,
	caseSensitive: boolean,
	sceneIds?: string[],
) => {
	return invokeCommand<ReplaceResult>("replace_in_project", {
		workId,
		searchText,
		replaceText,
		caseSensitive,
		sceneIds: sceneIds ?? null,
	});
};
