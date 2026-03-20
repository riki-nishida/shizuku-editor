import type { WorkOutline } from "@shared/types";
import { moveSceneToChapter, updateSceneSortOrder } from "../../editor";

export const handleSceneReorder = async (
	activeSceneId: string,
	overSceneId: string,
	nodes: WorkOutline,
	setNodes: (nodes: WorkOutline) => void,
	reload: () => void,
) => {
	const activeScene = nodes.scenes.find((s) => s.id === activeSceneId);
	const overScene = nodes.scenes.find((s) => s.id === overSceneId);

	if (!activeScene || !overScene) {
		return;
	}

	if (activeScene.chapter_id !== overScene.chapter_id) {
		const targetChapterId = overScene.chapter_id;
		const targetChapterScenes = nodes.scenes.filter(
			(s) => s.chapter_id === targetChapterId && !s.is_deleted,
		);

		const overIndex = targetChapterScenes.findIndex(
			(s) => s.id === overScene.id,
		);

		const newScenes = targetChapterScenes.filter(
			(s) => s.id !== activeScene.id,
		);
		newScenes.splice(overIndex, 0, {
			...activeScene,
			chapter_id: targetChapterId,
		});

		const updatedTargetScenes = newScenes.map((scene, index) => ({
			...scene,
			sort_order: index,
		}));

		const otherScenes = nodes.scenes.filter(
			(s) => s.chapter_id !== targetChapterId && s.id !== activeScene.id,
		);
		const allUpdatedScenes = [...otherScenes, ...updatedTargetScenes];

		setNodes({
			...nodes,
			scenes: allUpdatedScenes,
		});

		const updates: Promise<boolean>[] = [];
		updatedTargetScenes.forEach((scene, index) => {
			const originalScene = nodes.scenes.find((s) => s.id === scene.id);
			if (
				originalScene?.sort_order !== index ||
				originalScene?.chapter_id !== targetChapterId
			) {
				if (scene.id === activeScene.id) {
					updates.push(
						moveSceneToChapter(scene.id, targetChapterId, index).then(
							(result) => result.ok,
						),
					);
				} else {
					updates.push(
						updateSceneSortOrder(scene.id, index).then((result) => result.ok),
					);
				}
			}
		});

		const results = await Promise.all(updates);
		if (results.some((ok) => !ok)) {
			reload();
		}

		return;
	}

	const chapterId = activeScene.chapter_id;

	const allScenes = nodes.scenes.filter((s) => s.chapter_id === chapterId);

	if (allScenes.length === 0) {
		return;
	}
	const activeSceneIndex = allScenes.findIndex((s) => s.id === activeSceneId);
	const overSceneIndex = allScenes.findIndex((s) => s.id === overSceneId);

	const newScenes = [...allScenes];
	const [movedScene] = newScenes.splice(activeSceneIndex, 1);
	newScenes.splice(overSceneIndex, 0, movedScene);

	const updatedScenes = newScenes.map((scene, index) => ({
		...scene,
		sort_order: index,
	}));

	const otherScenes = nodes.scenes.filter((s) => s.chapter_id !== chapterId);
	const allUpdatedScenes = [...otherScenes, ...updatedScenes];

	setNodes({
		...nodes,
		scenes: allUpdatedScenes,
	});

	const updates: Promise<boolean>[] = [];
	updatedScenes.forEach((scene, index) => {
		const originalScene = nodes.scenes.find((s) => s.id === scene.id);
		if (originalScene?.sort_order !== index) {
			updates.push(
				updateSceneSortOrder(scene.id, index).then((result) => result.ok),
			);
		}
	});

	const results = await Promise.all(updates);
	if (results.some((ok) => !ok)) {
		reload();
	}
};
