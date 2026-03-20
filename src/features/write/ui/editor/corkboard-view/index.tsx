import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { selectedNodeAtom } from "@features/work";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Scene } from "../../../model/editor";
import { updateSceneSynopsis } from "../../../model/editor";
import { expandedChaptersAtom } from "../../../model/outline";
import styles from "./styles.module.css";

type CorkboardViewProps = {
	scenes: Scene[];
	chapterId: string;
	onReorder: (sceneId: string, newIndex: number) => void;
	onSynopsisUpdate?: (sceneId: string, synopsis: string) => void;
};

export const CorkboardView = ({
	scenes,
	chapterId,
	onReorder,
	onSynopsisUpdate,
}: CorkboardViewProps) => {
	const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
	const setExpandedChapters = useSetAtom(expandedChaptersAtom);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			const oldIndex = scenes.findIndex((s) => s.id === active.id);
			const newIndex = scenes.findIndex((s) => s.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				onReorder(active.id as string, newIndex);
			}
		},
		[scenes, onReorder],
	);

	const handleCardClick = useCallback(
		(sceneId: string) => {
			setExpandedChapters((current) => ({
				...current,
				[chapterId]: true,
			}));
			setSelectedNode({ id: sceneId, type: "scene" });
		},
		[chapterId, setExpandedChapters, setSelectedNode],
	);

	const handleSynopsisUpdate = useCallback(
		async (sceneId: string, synopsis: string) => {
			await updateSceneSynopsis(sceneId, synopsis);
			onSynopsisUpdate?.(sceneId, synopsis);
		},
		[onSynopsisUpdate],
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={scenes.map((s) => s.id)}
				strategy={rectSortingStrategy}
			>
				<div className={styles.grid}>
					{scenes.map((scene) => (
						<SceneCard
							key={scene.id}
							scene={scene}
							isSelected={
								selectedNode?.type === "scene" && selectedNode.id === scene.id
							}
							onClick={() => handleCardClick(scene.id)}
							onSynopsisUpdate={handleSynopsisUpdate}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
};

type SceneCardProps = {
	scene: Scene;
	isSelected: boolean;
	onClick: () => void;
	onSynopsisUpdate: (sceneId: string, synopsis: string) => void;
};

function SceneCard({
	scene,
	isSelected,
	onClick,
	onSynopsisUpdate,
}: SceneCardProps) {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(scene.synopsis);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: scene.id });

	const style: React.CSSProperties = {
		transform: transform ? CSS.Transform.toString(transform) : undefined,
		transition: transform ? transition : undefined,
		opacity: isDragging ? 0.5 : 1,
	};

	const handleSynopsisClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditValue(scene.synopsis);
		setIsEditing(true);
		setTimeout(() => {
			const textarea = textareaRef.current;
			if (textarea) {
				textarea.focus();
				const len = textarea.value.length;
				textarea.setSelectionRange(len, len);
			}
		}, 0);
	};

	const handleSynopsisBlur = () => {
		setIsEditing(false);
		if (editValue !== scene.synopsis) {
			onSynopsisUpdate(scene.id, editValue);
		}
	};

	const handleSynopsisKeyDown = (e: React.KeyboardEvent) => {
		e.stopPropagation();
		if (e.key === "Escape") {
			setEditValue(scene.synopsis);
			setIsEditing(false);
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: dnd-kit requires div element for sortable items
		<div
			ref={setNodeRef}
			style={style}
			className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
			{...attributes}
			{...listeners}
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
		>
			<div className={styles.cardHeader}>
				<h3 className={styles.cardTitle}>
					{scene.title || t("write.corkboard.untitled")}
				</h3>
			</div>
			{isEditing ? (
				<textarea
					ref={textareaRef}
					className={styles.synopsisTextarea}
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSynopsisBlur}
					onKeyDown={handleSynopsisKeyDown}
					onClick={(e) => e.stopPropagation()}
					placeholder={t("write.corkboard.synopsisPlaceholder")}
					rows={3}
				/>
			) : (
				/* biome-ignore lint/a11y/useKeyWithClickEvents: parent card handles keyboard */
				/* biome-ignore lint/a11y/noStaticElementInteractions: clickable text area */
				<div className={styles.cardSynopsis} onClick={handleSynopsisClick}>
					{scene.synopsis || <span className={styles.noSynopsis}></span>}
				</div>
			)}
			<div className={styles.cardFooter}>
				<span className={styles.cardWordCount}>
					{scene.word_count.toLocaleString()} {t("common.characters")}
				</span>
			</div>
		</div>
	);
}
