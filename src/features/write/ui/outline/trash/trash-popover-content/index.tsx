import type { SceneOutline } from "@shared/types";
import { useTranslation } from "react-i18next";
import { useChapterExpansion } from "../../../../model/outline/hooks/use-chapter-expansion";
import type { ChapterWithScenes } from "../../../../model/outline/hooks/use-structured-outline";
import { TrashNode } from "../trash-node";
import { TrashChapterGroup } from "../trash-section/trash-chapter-group";
import styles from "./styles.module.css";

type TrashPopoverContentProps = {
	chapters: ChapterWithScenes[];
	scenes: SceneOutline[];
};

export const TrashPopoverContent = ({
	chapters,
	scenes,
}: TrashPopoverContentProps) => {
	const { t } = useTranslation();
	const { toggle, expandedChapters } = useChapterExpansion(chapters);

	return (
		<div className={styles.content}>
			<h3 className={styles.title}>{t("sidebar.trash")}</h3>
			<div className={styles.list}>
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
		</div>
	);
};
