import { useToast } from "@shared/lib/toast";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getScenesByChapter, updateSceneContent } from "../../../model/editor";
import {
	enterManuscriptModeAtom,
	exitManuscriptModeAtom,
	isManuscriptModeAtom,
	manuscriptChapterIdAtom,
	manuscriptModifiedScenesAtom,
	manuscriptScenesAtom,
	markScenesSavedAtom,
	updateManuscriptScenesAtom,
} from "../../../model/manuscript";
import type {
	ManuscriptEditorChangeValue,
	ManuscriptSceneData,
} from "../../../model/manuscript/types";

export const useManuscriptState = (chapterId: string) => {
	const { t } = useTranslation();
	const { showError, showSuccess } = useToast();

	const isActive = useAtomValue(isManuscriptModeAtom);
	const scenes = useAtomValue(manuscriptScenesAtom);
	const currentChapterId = useAtomValue(manuscriptChapterIdAtom);
	const modifiedSceneIds = useAtomValue(manuscriptModifiedScenesAtom);

	const enterManuscriptMode = useSetAtom(enterManuscriptModeAtom);
	const exitManuscriptMode = useSetAtom(exitManuscriptModeAtom);
	const updateScenes = useSetAtom(updateManuscriptScenesAtom);
	const markScenesSaved = useSetAtom(markScenesSavedAtom);

	const isSaving = useRef(false);

	const isActiveForChapter = isActive && currentChapterId === chapterId;

	const handleEnterManuscriptMode = useCallback(async () => {
		const result = await getScenesByChapter(chapterId);
		if (!result.ok) {
			showError(t("write.editor.sceneFetchFailed"));
			return;
		}

		const activeScenes = result.value.filter((scene) => !scene.is_deleted);

		if (activeScenes.length === 0) {
			showError(t("write.editor.noScenesAvailable"));
			return;
		}

		const manuscriptScenes: ManuscriptSceneData[] = activeScenes.map(
			(scene) => ({
				id: scene.id,
				title: scene.title,
				contentText: scene.content_text,
				contentMarkups: JSON.parse(scene.content_markups || "[]"),
			}),
		);

		enterManuscriptMode({ chapterId, scenes: manuscriptScenes });
	}, [chapterId, enterManuscriptMode, showError, t]);

	const handleExitManuscriptMode = useCallback(() => {
		if (modifiedSceneIds.size > 0) {
		}
		exitManuscriptMode();
	}, [exitManuscriptMode, modifiedSceneIds]);

	const handleContentChange = useCallback(
		(value: ManuscriptEditorChangeValue) => {
			updateScenes({
				scenes: value.scenes,
				modifiedSceneIds: value.modifiedSceneIds,
			});
		},
		[updateScenes],
	);

	const handleSave = useCallback(async () => {
		if (isSaving.current || modifiedSceneIds.size === 0) {
			return;
		}

		isSaving.current = true;

		try {
			const savedIds: string[] = [];

			for (const sceneId of modifiedSceneIds) {
				const scene = scenes.find((s) => s.id === sceneId);
				if (!scene) continue;

				const result = await updateSceneContent(
					sceneId,
					scene.contentText,
					JSON.stringify(scene.contentMarkups),
				);

				if (result.ok) {
					savedIds.push(sceneId);
				} else {
					showError(t("write.editor.sceneSaveFailed", { name: scene.title }));
				}
			}

			if (savedIds.length > 0) {
				markScenesSaved(savedIds);
				if (savedIds.length === modifiedSceneIds.size) {
					showSuccess(t("write.editor.allScenesSaved"));
				}
			}
		} finally {
			isSaving.current = false;
		}
	}, [scenes, modifiedSceneIds, markScenesSaved, showError, showSuccess, t]);

	return {
		isActiveForChapter,
		scenes,
		modifiedSceneIds,
		handleEnterManuscriptMode,
		handleExitManuscriptMode,
		handleContentChange,
		handleSave,
	};
};
