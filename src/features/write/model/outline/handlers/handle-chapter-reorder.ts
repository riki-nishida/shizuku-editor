import type { WorkOutline } from "@shared/types";
import { updateChapterSortOrder } from "../../editor";

export const handleChapterReorder = async (
	activeChapterId: string,
	overChapterId: string,
	nodes: WorkOutline,
	setNodes: (nodes: WorkOutline) => void,
	reload: () => void,
) => {
	const visibleChapters = nodes.chapters.filter((ch) => !ch.is_deleted);

	const activeIndex = visibleChapters.findIndex(
		(ch) => ch.id === activeChapterId,
	);
	const overIndex = visibleChapters.findIndex((ch) => ch.id === overChapterId);

	if (activeIndex === -1 || overIndex === -1) {
		return;
	}

	const deletedChapters = nodes.chapters.filter((ch) => ch.is_deleted);

	const newVisibleChapters = [...visibleChapters];
	const [movedChapter] = newVisibleChapters.splice(activeIndex, 1);
	newVisibleChapters.splice(overIndex, 0, movedChapter);

	const updatedVisibleChapters = newVisibleChapters.map((chapter, index) => ({
		...chapter,
		sort_order: index,
	}));

	const updatedChapters = [...updatedVisibleChapters, ...deletedChapters];

	setNodes({
		...nodes,
		chapters: updatedChapters,
	});

	const updates: Promise<boolean>[] = [];
	updatedVisibleChapters.forEach((chapter, index) => {
		const originalChapter = visibleChapters.find((c) => c.id === chapter.id);
		if (originalChapter?.sort_order !== index) {
			updates.push(
				updateChapterSortOrder(chapter.id, index).then((result) => result.ok),
			);
		}
	});

	const results = await Promise.all(updates);
	if (results.some((ok) => !ok)) {
		reload();
	}
};
