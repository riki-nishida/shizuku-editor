import type { ChapterWithScenes } from "../../../../model/outline/hooks/use-structured-outline";
import { TrashNode } from "../trash-node";
import styles from "./styles.module.css";

type TrashChapterGroupProps = {
	chapter: ChapterWithScenes;
	isCollapsed: boolean;
	toggleChapter: (id: string) => void;
};

export const TrashChapterGroup = ({
	chapter,
	isCollapsed,
	toggleChapter,
}: TrashChapterGroupProps) => {
	return (
		<div className={styles.chapterGroup}>
			<TrashNode
				id={chapter.id}
				type="chapter"
				title={chapter.title}
				isCollapsed={isCollapsed}
				onToggle={() => toggleChapter(chapter.id)}
			/>
			{!isCollapsed && chapter.scenes.length > 0 && (
				<div className={styles.scenes}>
					{chapter.scenes.map((scene) => (
						<TrashNode
							key={`deleted-scene-${scene.id}`}
							id={scene.id}
							type="scene"
							title={scene.title}
							hideRestore
						/>
					))}
				</div>
			)}
		</div>
	);
};
