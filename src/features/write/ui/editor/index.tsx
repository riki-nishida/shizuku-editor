import { editorSettingsAtom } from "@features/settings";
import { selectedNodeAtom } from "@features/work";
import { useToast } from "@shared/lib/toast";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	loadSelectedSceneAtom,
	selectedSceneAtom,
} from "../../model/editor/store";
import type { Scene } from "../../model/editor/types";
import { useEditorState } from "../../model/editor/use-editor-state";
import { outlineNodesAtom } from "../../model/outline";
import { createSnapshotAtom } from "../../model/version/store";
import { ChapterDashboard } from "./chapter-dashboard";
import { EditorFooter } from "./editor-footer";
import { SceneEditor } from "./scene-editor";
import styles from "./styles.module.css";

export const Editor = () => {
	const selectedNode = useAtomValue(selectedNodeAtom);
	const outline = useAtomValue(outlineNodesAtom);
	const selectedScene = useAtomValue(selectedSceneAtom);
	const loadScene = useSetAtom(loadSelectedSceneAtom);

	const selectedChapter = useMemo(() => {
		if (selectedNode?.type !== "chapter" || !outline) return null;
		return outline.chapters.find((ch) => ch.id === selectedNode.id) ?? null;
	}, [selectedNode, outline]);

	useEffect(() => {
		const sceneId = selectedNode?.type === "scene" ? selectedNode.id : null;
		loadScene(sceneId);
	}, [selectedNode, loadScene]);

	if (!selectedNode) {
		return null;
	}

	if (selectedNode.type === "chapter") {
		if (selectedChapter?.is_deleted) {
			return null;
		}

		return (
			<ChapterDashboard
				chapterId={selectedNode.id}
				chapterTitle={selectedChapter?.title ?? ""}
			/>
		);
	}

	if (!selectedScene) {
		return <section className={styles.panel} />;
	}

	if (selectedScene.is_deleted) {
		return null;
	}

	return <SceneEditorContent key={selectedScene.id} scene={selectedScene} />;
};

type SceneEditorContentProps = {
	scene: Scene;
};

function SceneEditorContent({ scene }: SceneEditorContentProps) {
	const { t } = useTranslation();
	const editorState = useEditorState(scene);
	const editorSettings = useAtomValue(editorSettingsAtom);
	const isVertical = editorSettings.writingMode === "vertical";
	const createSnapshot = useSetAtom(createSnapshotAtom);
	const { showSuccess, showError } = useToast();

	const handleSnapshot = useCallback(async () => {
		const success = await createSnapshot(scene.id);
		if (success) {
			showSuccess(t("write.editor.snapshotSaved"));
		} else {
			showError(t("write.editor.snapshotFailed"));
		}
	}, [createSnapshot, scene.id, showSuccess, showError, t]);

	return (
		<section
			className={`${styles.panel}${isVertical ? ` ${styles.panelVertical}` : ""}`}
		>
			<SceneEditor
				key={scene.id}
				sceneId={scene.id}
				contentText={editorState.draftContentText}
				contentMarkups={editorState.draftContentMarkups}
				onChange={editorState.handleContentChange}
				onSave={editorState.handleSave}
				onSnapshot={handleSnapshot}
			/>
			<EditorFooter />
		</section>
	);
}
