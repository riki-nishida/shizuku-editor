import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { buildDndId, useSortableItem } from "@shared/lib/dnd";
import clsx from "clsx";
import { NavArrowDown, Plus } from "iconoir-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDragState } from "../../../../model/outline/hooks/use-drag-state";
import type { ChapterWithScenes } from "../../../../model/outline/hooks/use-structured-outline";
import {
	addingNodeAtom,
	chapterToExpandAtom,
	expandedChaptersAtom,
} from "../../../../model/outline/store";
import { AddNodeInput } from "../../add-node-input";
import { BaseNode } from "../outline-node";
import outlineNodeStyles from "../outline-node/styles.module.css";
import { SortableScene } from "../sortable-scene";
import styles from "./styles.module.css";

type Props = {
	chapter: ChapterWithScenes;
	workId: string | null;
};

export const SortableChapter = ({ chapter, workId }: Props) => {
	const { t } = useTranslation();
	const addingNode = useAtomValue(addingNodeAtom);
	const setAddingNode = useSetAtom(addingNodeAtom);
	const setChapterToExpand = useSetAtom(chapterToExpandAtom);
	const [expandedChapters, setExpandedChapters] = useAtom(expandedChaptersAtom);
	const isCollapsed = expandedChapters[chapter.id] === false;

	const isAddingSceneToThisChapter =
		addingNode?.type === "scene" && addingNode.chapterId === chapter.id;

	const toggle = useCallback(() => {
		setExpandedChapters((current) => ({
			...current,
			[chapter.id]: !current[chapter.id],
		}));
	}, [chapter.id, setExpandedChapters]);

	const handleAddScene = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setChapterToExpand(chapter.id);
			setAddingNode({ type: "scene", chapterId: chapter.id });
		},
		[chapter.id, setAddingNode, setChapterToExpand],
	);

	const { isDraggingScene } = useDragState();

	const {
		attributes,
		listeners,
		setNodeRef,
		style,
		isOver,
		isBefore,
		showIndicator: baseShowIndicator,
	} = useSortableItem({
		id: buildDndId("chapter", chapter.id),
	});

	const showSortIndicator = baseShowIndicator && !isDraggingScene;

	const showDropTarget = isOver && isDraggingScene;

	return (
		<div className={styles.chapter}>
			<div
				ref={setNodeRef}
				style={style}
				className={clsx(
					styles.header,
					showSortIndicator && styles.sortIndicator,
					showSortIndicator && isBefore && styles.sortIndicatorBefore,
					showSortIndicator && !isBefore && styles.sortIndicatorAfter,
					showDropTarget && styles.dropTarget,
				)}
				{...attributes}
				{...listeners}
			>
				<BaseNode
					id={chapter.id}
					title={chapter.title}
					type="chapter"
					icon={
						<button
							type="button"
							className={clsx(
								outlineNodeStyles.iconButton,
								isCollapsed && outlineNodeStyles.collapsed,
							)}
							aria-label={
								isCollapsed
									? t("common.expandChapter")
									: t("common.collapseChapter")
							}
							aria-expanded={!isCollapsed}
							onClick={toggle}
							onPointerDown={(e) => e.stopPropagation()}
							data-collapsed={isCollapsed}
						>
							<NavArrowDown aria-hidden="true" />
						</button>
					}
					className={showDropTarget ? outlineNodeStyles.dropTarget : undefined}
					action={
						<button
							type="button"
							className={styles.addSceneButton}
							aria-label={t("common.addScene")}
							onClick={handleAddScene}
							onPointerDown={(e) => e.stopPropagation()}
						>
							<Plus width={14} height={14} />
						</button>
					}
				/>
			</div>
			{!isCollapsed &&
				(chapter.scenes.length > 0 || isAddingSceneToThisChapter) && (
					<SortableContext
						items={chapter.scenes.map((s) => buildDndId("scene", s.id))}
						strategy={verticalListSortingStrategy}
					>
						<div className={styles.sceneList}>
							{chapter.scenes.map((scene) => (
								<SortableScene
									key={scene.id}
									sceneId={scene.id}
									title={scene.title}
								/>
							))}
							{isAddingSceneToThisChapter && workId && (
								<AddNodeInput
									type="scene"
									workId={workId}
									chapterId={chapter.id}
								/>
							)}
						</div>
					</SortableContext>
				)}
		</div>
	);
};
