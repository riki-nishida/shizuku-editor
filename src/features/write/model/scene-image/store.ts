import { atom } from "jotai";
import {
	addSceneImage,
	deleteSceneImage,
	getSceneImages,
	updateSceneImageSortOrder,
} from "./commands";
import type { SceneImage } from "./types";

export const sceneImagesAtom = atom<SceneImage[]>([]);
export const sceneImagesLoadingAtom = atom(false);

export const loadSceneImagesAtom = atom(
	null,
	async (_get, set, sceneId: string) => {
		set(sceneImagesLoadingAtom, true);
		try {
			const result = await getSceneImages(sceneId);
			if (result.ok) {
				set(sceneImagesAtom, result.value);
			}
		} finally {
			set(sceneImagesLoadingAtom, false);
		}
	},
);

export const addSceneImageAtom = atom(
	null,
	async (
		_get,
		set,
		{ sceneId, sourcePath }: { sceneId: string; sourcePath: string },
	) => {
		const result = await addSceneImage(sceneId, sourcePath);
		if (result.ok) {
			set(sceneImagesAtom, (prev) => [...prev, result.value]);
			return result.value;
		}
		return null;
	},
);

export const deleteSceneImageAtom = atom(
	null,
	async (_get, set, imageId: string) => {
		const result = await deleteSceneImage(imageId);
		if (result.ok) {
			set(sceneImagesAtom, (prev) => prev.filter((img) => img.id !== imageId));
			return true;
		}
		return false;
	},
);

export const reorderSceneImagesAtom = atom(
	null,
	async (
		_get,
		set,
		{ imageId, newSortOrder }: { imageId: string; newSortOrder: number },
	) => {
		const result = await updateSceneImageSortOrder(imageId, newSortOrder);
		if (result.ok) {
			set(sceneImagesAtom, (prev) => {
				const updated = prev.map((img) =>
					img.id === imageId ? { ...img, sort_order: newSortOrder } : img,
				);
				return updated.sort((a, b) => a.sort_order - b.sort_order);
			});
			return true;
		}
		return false;
	},
);
