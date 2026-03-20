import type { SceneOutline } from "@shared/types";
import clsx from "clsx";
import { NavArrowDown } from "iconoir-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChapterExpansion } from "../../../../model/outline/hooks/use-chapter-expansion";
import type { ChapterWithScenes } from "../../../../model/outline/hooks/use-structured-outline";
import { TrashNode } from "../trash-node";
import styles from "./styles.module.css";
import { TrashChapterGroup } from "./trash-chapter-group";

type TrashSectionProps = {
	chapters: ChapterWithScenes[];
	scenes: SceneOutline[];
};

export const TrashSection = ({ chapters, scenes }: TrashSectionProps) => {
	const { t } = useTranslation();
	const [isTrashCollapsed, setIsTrashCollapsed] = useState(true);

	const { toggle, expandedChapters } = useChapterExpansion(chapters);

	if (chapters.length === 0 && scenes.length === 0) {
		return null;
	}

	return (
		<div className={styles.trash}>
			<div className={styles.trashHeader}>
				<button
					type="button"
					className={clsx(
						styles.toggleButton,
						isTrashCollapsed && styles.collapsed,
					)}
					aria-label={
						isTrashCollapsed ? t("outline.trashOpen") : t("outline.trashClose")
					}
					aria-expanded={!isTrashCollapsed}
					onClick={() => setIsTrashCollapsed(!isTrashCollapsed)}
				>
					<NavArrowDown aria-hidden="true" />
				</button>
				<span className={styles.trashLabel}>{t("sidebar.trash")}</span>
			</div>
			{!isTrashCollapsed && (
				<div className={styles.trashContent}>
					{chapters.map((chapter) => (
						<TrashChapterGroup
							key={`deleted-chapter-${chapter.id}`}
							chapter={chapter}
							isCollapsed={expandedChapters[chapter.id] === false}
							toggleChapter={toggle}
						/>
					))}
					{scenes.map((scene) => (
						<TrashNode
							key={scene.id}
							id={scene.id}
							type="scene"
							title={scene.title}
						/>
					))}
				</div>
			)}
		</div>
	);
};
