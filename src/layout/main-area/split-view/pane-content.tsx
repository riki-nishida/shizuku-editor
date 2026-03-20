import { editorSettingsAtom } from "@features/settings";
import { getScene } from "@features/write/model/editor/commands";
import { useEditorState } from "@features/write/model/editor/use-editor-state";
import { EditorFooter } from "@features/write/ui/editor/editor-footer";
import { SceneEditor } from "@features/write/ui/editor/scene-editor";
import { calculateWordCount } from "@shared/lib/text";
import type { PaneContent } from "@shared/store/split-view";
import type { Scene } from "@shared/types";
import { Page } from "iconoir-react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type Props = {
	content: PaneContent;
	paneId: string;
	isActive: boolean;
};

const sceneCacheAtom = atom<Record<string, Scene | null>>({});

export const PaneContentRenderer = ({ content, paneId, isActive }: Props) => {
	if (content.type === "empty") {
		return <EmptyPane />;
	}

	if (content.type === "scene") {
		return (
			<ScenePane
				sceneId={content.sceneId}
				paneId={paneId}
				isActive={isActive}
			/>
		);
	}

	return <EmptyPane />;
};

const EmptyPane = () => {
	const { t } = useTranslation();
	return (
		<div className={styles.emptyPane}>
			<Page width={48} height={48} className={styles.emptyPaneIcon} />
			<p className={styles.emptyPaneText}>
				{t("mainArea.selectSceneFromOutline")}
			</p>
		</div>
	);
};

type ScenePaneProps = {
	sceneId: string;
	paneId: string;
	isActive: boolean;
};

const ScenePane = ({ sceneId, paneId, isActive }: ScenePaneProps) => {
	const [sceneCache, setSceneCache] = useAtom(sceneCacheAtom);
	const scene = sceneCache[`${paneId}-${sceneId}`] ?? null;

	useEffect(() => {
		const loadScene = async () => {
			const result = await getScene(sceneId);
			if (result.ok) {
				setSceneCache((prev) => ({
					...prev,
					[`${paneId}-${sceneId}`]: result.value,
				}));
			}
		};
		loadScene();
	}, [sceneId, paneId, setSceneCache]);

	if (!scene || scene.is_deleted) {
		return <div className={styles.paneContent} />;
	}

	return <SceneEditorWrapper scene={scene} isActive={isActive} />;
};

type SceneEditorWrapperProps = {
	scene: Scene;
	isActive: boolean;
};

const SceneEditorWrapper = ({ scene, isActive }: SceneEditorWrapperProps) => {
	const editorState = useEditorState(scene);
	const editorSettings = useAtomValue(editorSettingsAtom);
	const isVertical = editorSettings.writingMode === "vertical";
	const wordCount = calculateWordCount(editorState.draftContentText);

	return (
		<section
			className={`${styles.scenePanel}${isVertical ? ` ${styles.scenePanelVertical}` : ""}`}
		>
			<SceneEditor
				key={scene.id}
				sceneId={scene.id}
				contentText={editorState.draftContentText}
				contentMarkups={editorState.draftContentMarkups}
				onChange={editorState.handleContentChange}
				onSave={editorState.handleSave}
				isActive={isActive}
			/>
			<EditorFooter wordCount={wordCount} />
		</section>
	);
};
