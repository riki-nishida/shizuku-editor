import { editorSettingsAtom } from "@features/settings";
import type { EditorSettings } from "@features/settings/model";
import type {
	ContentMarkup,
	EditorChangeValue,
} from "@features/write/model/editor/types";
import { isMacOS } from "@shared/lib/platform";
import { useBaseEditor } from "@shared/lib/tiptap";
import type { Editor } from "@tiptap/react";
import { useAtomValue } from "jotai";
import { useEditorEditable } from "../hooks/use-editor-editable";
import { useEditorInstanceSync } from "../hooks/use-editor-instance-sync";
import { useWritingModeExtensions } from "../hooks/use-writing-mode-extensions";

type Params = {
	contentText: string;
	contentMarkups: ContentMarkup[];
	onChange: (value: EditorChangeValue) => void;
	onSave: () => void;
	onSnapshot?: () => void;
};

type Result = {
	editor: Editor | null;
	isVertical: boolean;
	editorSettings: EditorSettings;
};

export const useSceneEditor = ({
	contentText,
	contentMarkups,
	onChange,
	onSave,
	onSnapshot,
}: Params): Result => {
	const editorSettings = useAtomValue(editorSettingsAtom);
	const isVertical = editorSettings.writingMode === "vertical";

	const extensions = useWritingModeExtensions({ editorSettings, isVertical });

	const editor = useBaseEditor({
		contentText,
		contentMarkups,
		onChange,
		onSave,
		onSnapshot,
		extensions,
	});

	const editable = !isVertical || !isMacOS();
	useEditorEditable(editor, editable);
	useEditorInstanceSync(editor);

	return { editor, isVertical, editorSettings };
};
