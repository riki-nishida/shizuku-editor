import type { WorkOutline } from "@shared/types";
import { moveSceneToChapter } from "../../editor";

export const handleSceneToChapterDrop = async (
	sceneId: string,
	targetChapterId: string,
	nodes: WorkOutline,
	setNodes: (nodes: WorkOutline) => void,
	reload: () => void,
) => {
	const scene = nodes.scenes.find((s) => s.id === sceneId);
	if (!scene) {
		return;
	}

	if (scene.chapter_id === targetChapterId) {
		return;
	}

	const targetChapterScenes = nodes.scenes.filter(
		(s) => s.chapter_id === targetChapterId && !s.is_deleted,
	);

	const newSortOrder = targetChapterScenes.length;

	const updatedScene = {
		...scene,
		chapter_id: targetChapterId,
		sort_order: newSortOrder,
	};

	const updatedScenes = nodes.scenes.map((s) =>
		s.id === scene.id ? updatedScene : s,
	);

	setNodes({
		...nodes,
		scenes: updatedScenes,
	});

	try {
		await moveSceneToChapter(scene.id, targetChapterId, newSortOrder);
	} catch {
		reload();
	}
};
