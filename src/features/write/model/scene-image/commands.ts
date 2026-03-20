import { invokeCommand } from "@shared/lib/commands";
import type { SceneImage } from "./types";

export const getSceneImages = (sceneId: string) => {
	return invokeCommand<SceneImage[]>("get_scene_images", { sceneId });
};

export const addSceneImage = (sceneId: string, sourcePath: string) => {
	return invokeCommand<SceneImage>("add_scene_image", {
		sceneId,
		sourcePath,
	});
};

export const deleteSceneImage = (imageId: string) => {
	return invokeCommand<void>("delete_scene_image", { imageId });
};

export const updateSceneImageSortOrder = (
	imageId: string,
	newSortOrder: number,
) => {
	return invokeCommand<void>("update_scene_image_sort_order", {
		imageId,
		newSortOrder,
	});
};

export const getSceneImagePath = (relativePath: string) => {
	return invokeCommand<string>("get_scene_image_path", { relativePath });
};
