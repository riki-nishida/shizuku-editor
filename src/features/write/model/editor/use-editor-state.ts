import { useAutoSave } from "@shared/hooks/use-auto-save";
import { calculateWordCount } from "@shared/lib/text";
import { parseMarkups, serializeMarkups } from "@shared/lib/tiptap";
import { liveWordCountAtom } from "@shared/store/ui";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { updateSceneWordCountAtom } from "../outline/store";
import { updateSceneContent } from "./commands";
import { sceneDraftAtomFamily, updateSelectedSceneAtom } from "./store";
import type { ContentMarkup, EditorChangeValue, Scene } from "./types";

export type EditorState = {
	draftContentText: string;
	draftContentMarkups: ContentMarkup[];
	handleContentChange: (value: EditorChangeValue) => void;
	handleSave: () => Promise<void>;
};

export const useEditorState = (scene: Scene): EditorState => {
	const updateScene = useSetAtom(updateSelectedSceneAtom);
	const setLiveWordCount = useSetAtom(liveWordCountAtom);
	const updateOutlineWordCount = useSetAtom(updateSceneWordCountAtom);

	const draftAtom = useMemo(() => sceneDraftAtomFamily(scene.id), [scene.id]);
	const [draftState, setDraftState] = useAtom(draftAtom);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run on scene.id change
	useEffect(() => {
		const contentText = scene.content_text || "";
		const contentMarkups = parseMarkups(scene.content_markups);

		setDraftState({ contentText, contentMarkups });
		const wordCount = calculateWordCount(contentText);
		setLiveWordCount(wordCount);
		updateOutlineWordCount({ sceneId: scene.id, wordCount });
	}, [scene.id]);

	const draftValue = JSON.stringify({
		text: draftState.contentText,
		markups: draftState.contentMarkups,
	});

	const handleSaveToBackend = useCallback(
		async (value: string) => {
			const { text, markups } = JSON.parse(value);
			await updateSceneContent(scene.id, text, serializeMarkups(markups));
			updateScene({ updated_at: new Date().toISOString() });
		},
		[scene.id, updateScene],
	);

	const { handleSave } = useAutoSave({
		value: draftValue,
		itemId: scene.id,
		onSave: handleSaveToBackend,
	});

	const handleContentChange = useCallback(
		(value: EditorChangeValue) => {
			setDraftState({
				contentText: value.contentText,
				contentMarkups: value.contentMarkups,
			});

			const wordCount = calculateWordCount(value.contentText);
			setLiveWordCount(wordCount);
			updateOutlineWordCount({ sceneId: scene.id, wordCount });
		},
		[scene.id, setDraftState, setLiveWordCount, updateOutlineWordCount],
	);

	return {
		draftContentText: draftState.contentText,
		draftContentMarkups: draftState.contentMarkups,
		handleContentChange,
		handleSave,
	};
};
