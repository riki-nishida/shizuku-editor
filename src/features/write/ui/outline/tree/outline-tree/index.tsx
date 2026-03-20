import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { buildDndId } from "@shared/lib/dnd";
import { NodeDragOverlay } from "@shared/ui/sidebar-node";
import { useAtomValue } from "jotai";
import type { ChapterWithScenes } from "../../../../model/outline/hooks/use-structured-outline";
import { addingNodeAtom } from "../../../../model/outline/store";
import { AddNodeInput } from "../../add-node-input";
import styles from "../../styles.module.css";
import { SortableChapter } from "../sortable-chapter";
import { useOutlineDnd } from "./use-outline-dnd";

type Props = {
	chapters: ChapterWithScenes[];
	workId: string | null;
};

export const OutlineTree = ({ chapters, workId }: Props) => {
	const addingNode = useAtomValue(addingNodeAtom);
	const {
		sensors,
		handleDragStart,
		handleDragEnd,
		collisionDetection,
		activeItem,
	} = useOutlineDnd();

	const sortableItems = chapters.map((ch) => buildDndId("chapter", ch.id));

	if (chapters.length === 0 && !addingNode) {
		return null;
	}

	return (
		<div className={styles.tree}>
			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis]}
				collisionDetection={collisionDetection}
			>
				<SortableContext
					items={sortableItems}
					strategy={verticalListSortingStrategy}
				>
					{chapters.map((chapter) => (
						<SortableChapter
							key={chapter.id}
							chapter={chapter}
							workId={workId}
						/>
					))}
				</SortableContext>
				<DragOverlay dropAnimation={null}>
					{activeItem && <NodeDragOverlay title={activeItem.title} />}
				</DragOverlay>
			</DndContext>
			{addingNode?.type === "chapter" && workId && (
				<AddNodeInput type="chapter" workId={workId} />
			)}
		</div>
	);
};
