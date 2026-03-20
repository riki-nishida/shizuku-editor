import {
	type ChapterViewMode,
	chapterViewModeAtom,
} from "@layout/title-bar/title-bar-content/use-chapter-view-mode";
import { useToast } from "@shared/lib/toast";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	getScenesByChapter,
	type Scene,
	updateSceneSortOrder,
} from "../../../model/editor";
import { outlineNodesAtom, reorderSceneAtom } from "../../../model/outline";
import { CorkboardView } from "../corkboard-view";
import { ManuscriptEditor } from "../manuscript-editor";
import { useManuscriptState } from "../manuscript-editor/use-manuscript-state";
import styles from "./styles.module.css";

type Props = {
	chapterId: string;
	chapterTitle: string;
};

export const ChapterDashboard = ({ chapterId }: Props) => {
	const { t } = useTranslation();
	const { showError } = useToast();
	const reorderScene = useSetAtom(reorderSceneAtom);
	const outlineNodes = useAtomValue(outlineNodesAtom);

	const [scenes, setScenes] = useState<Scene[] | null>(null);
	const viewMode = useAtomValue(chapterViewModeAtom);

	const outlineSceneOrder = useMemo(() => {
		if (!outlineNodes) return null;
		return outlineNodes.scenes
			.filter((s) => s.chapter_id === chapterId && !s.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((s) => s.id);
	}, [outlineNodes, chapterId]);

	const {
		isActiveForChapter: isManuscriptActive,
		scenes: manuscriptScenes,
		handleEnterManuscriptMode,
		handleExitManuscriptMode,
		handleContentChange: handleManuscriptChange,
		handleSave: handleManuscriptSave,
	} = useManuscriptState(chapterId);

	const prevViewModeRef = useRef<ChapterViewMode>(viewMode);
	const isProcessingRef = useRef(false);

	useEffect(() => {
		if (isProcessingRef.current) return;

		const prevViewMode = prevViewModeRef.current;
		prevViewModeRef.current = viewMode;

		if (prevViewMode !== viewMode) {
			const handleViewModeChange = async () => {
				isProcessingRef.current = true;
				try {
					if (viewMode === "manuscript" && !isManuscriptActive) {
						await handleEnterManuscriptMode();
					} else if (viewMode === "corkboard" && isManuscriptActive) {
						handleExitManuscriptMode();
					}
				} finally {
					isProcessingRef.current = false;
				}
			};
			void handleViewModeChange();
		}
	}, [
		viewMode,
		isManuscriptActive,
		handleEnterManuscriptMode,
		handleExitManuscriptMode,
	]);

	useEffect(() => {
		const fetchScenes = async () => {
			const result = await getScenesByChapter(chapterId);
			if (result.ok) {
				const activeScenes = result.value.filter(
					(scene: Scene) => !scene.is_deleted,
				);
				setScenes(activeScenes);
			} else {
				showError(t("write.editor.sceneFetchFailed"));
				setScenes([]);
			}
		};

		fetchScenes();
	}, [chapterId, showError, t]);

	useEffect(() => {
		if (!scenes || !outlineSceneOrder) return;

		const currentOrder = scenes.map((s) => s.id);
		const orderChanged =
			currentOrder.length === outlineSceneOrder.length &&
			!currentOrder.every((id, i) => id === outlineSceneOrder[i]);

		if (orderChanged) {
			const reorderedScenes = outlineSceneOrder
				.map((id) => scenes.find((s) => s.id === id))
				.filter((s): s is Scene => s !== undefined);
			setScenes(reorderedScenes);
		}
	}, [outlineSceneOrder, scenes]);

	const handleReorder = useCallback(
		async (sceneId: string, newIndex: number) => {
			if (!scenes) return;

			const newSortOrder = newIndex + 1;

			const oldIndex = scenes.findIndex((s) => s.id === sceneId);
			if (oldIndex === -1) return;

			const newScenes = [...scenes];
			const [movedScene] = newScenes.splice(oldIndex, 1);
			newScenes.splice(newIndex, 0, movedScene);
			setScenes(newScenes);

			reorderScene({ sceneId, chapterId, newIndex });

			const result = await updateSceneSortOrder(sceneId, newSortOrder);
			if (!result.ok) {
				showError(t("write.editor.sceneReorderFailed"));

				setScenes(scenes);
			}
		},
		[scenes, showError, reorderScene, chapterId, t],
	);

	if (scenes === null) {
		return <div className={styles.container} />;
	}

	if (scenes.length === 0) {
		return (
			<div className={styles.container}>
				<div className={styles.emptyState}>{t("write.editor.noScenesYet")}</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{viewMode === "manuscript" && manuscriptScenes.length > 0 ? (
				<ManuscriptEditor
					scenes={manuscriptScenes}
					onChange={handleManuscriptChange}
					onSave={handleManuscriptSave}
				/>
			) : (
				<CorkboardView
					scenes={scenes}
					chapterId={chapterId}
					onReorder={handleReorder}
					onSynopsisUpdate={(sceneId, synopsis) => {
						setScenes((prev) =>
							prev
								? prev.map((s) => (s.id === sceneId ? { ...s, synopsis } : s))
								: prev,
						);
					}}
				/>
			)}
		</div>
	);
};
