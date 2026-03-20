import { editorSettingsAtom } from "@features/settings";
import type { EditorSettings } from "@features/settings/model";
import { isMacOS } from "@shared/lib/platform";
import { SaveShortcut } from "@shared/lib/tiptap";
import {
	htmlToScenes,
	scenesToHtml,
} from "@shared/lib/tiptap/manuscript-converter";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import type {
	ManuscriptEditorChangeValue,
	ManuscriptSceneData,
} from "../../../model/manuscript/types";
import { useEditorEditable } from "../hooks/use-editor-editable";
import { useEditorInstanceSync } from "../hooks/use-editor-instance-sync";
import { useWritingModeExtensions } from "../hooks/use-writing-mode-extensions";
import { SceneSeparator } from "../scene-editor/extensions/scene-separator";

type Params = {
	scenes: ManuscriptSceneData[];
	onChange: (value: ManuscriptEditorChangeValue) => void;
	onSave: () => void;
};

type Result = {
	editor: Editor | null;
	isVertical: boolean;
	editorSettings: EditorSettings;
};

export const useManuscriptEditor = ({
	scenes,
	onChange,
	onSave,
}: Params): Result => {
	const editorSettings = useAtomValue(editorSettingsAtom);
	const isVertical = editorSettings.writingMode === "vertical";

	const latestOnChangeRef = useRef(onChange);
	const latestOnSaveRef = useRef(onSave);
	const latestScenesRef = useRef(scenes);

	useEffect(() => {
		latestOnChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		latestOnSaveRef.current = onSave;
	}, [onSave]);

	useEffect(() => {
		latestScenesRef.current = scenes;
	}, [scenes]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: initial content only on mount, external updates handled separately
	const initialHtml = useMemo(() => scenesToHtml(scenes), []);

	const writingModeExtensions = useWritingModeExtensions({
		editorSettings,
		isVertical,
	});

	const extensions = useMemo(
		() => [
			Document,
			Paragraph,
			Text,
			HardBreak,
			History,
			Dropcursor,
			Gapcursor,
			SceneSeparator,
			SaveShortcut.configure({
				onSave: () => latestOnSaveRef.current(),
			}),
			...writingModeExtensions,
		],
		[writingModeExtensions],
	);

	const editor = useEditor(
		{
			extensions,
			content: initialHtml,
			onUpdate: ({ editor: instance }) => {
				const html = instance.getHTML();
				const { scenes: updatedScenes, modifiedSceneIds } = htmlToScenes(
					html,
					latestScenesRef.current,
				);
				latestOnChangeRef.current({
					scenes: updatedScenes,
					modifiedSceneIds,
				});
			},
		},
		[extensions],
	);

	useEffect(() => {
		if (!editor) return;

		const newHtml = scenesToHtml(scenes);
		const currentHtml = editor.getHTML();
		if (newHtml !== currentHtml) {
			editor.commands.setContent(newHtml, { emitUpdate: false });
		}
	}, [editor, scenes]);

	const editable = !isVertical || !isMacOS();
	useEditorEditable(editor, editable);
	useEditorInstanceSync(editor);

	return { editor, isVertical, editorSettings };
};
