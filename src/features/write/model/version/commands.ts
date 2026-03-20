import { invokeCommand } from "@shared/lib/commands";
import type { SceneVersion } from "./types";

export const createSceneVersion = (sceneId: string, label?: string) => {
	return invokeCommand<SceneVersion>("create_scene_version", {
		sceneId,
		label: label ?? null,
	});
};

export const getSceneVersions = (sceneId: string) => {
	return invokeCommand<SceneVersion[]>("get_scene_versions", {
		sceneId,
	});
};

export const getSceneVersion = (versionId: string) => {
	return invokeCommand<SceneVersion>("get_scene_version", {
		versionId,
	});
};

export const restoreSceneVersion = (
	versionId: string,
	preRestoreLabel?: string,
) => {
	return invokeCommand<boolean>("restore_scene_version", {
		versionId,
		preRestoreLabel: preRestoreLabel ?? null,
	});
};

export const deleteSceneVersion = (versionId: string) => {
	return invokeCommand<void>("delete_scene_version", {
		versionId,
	});
};

export const updateSceneVersionLabel = (
	versionId: string,
	label: string | null,
) => {
	return invokeCommand<void>("update_scene_version_label", {
		versionId,
		label,
	});
};
