import type { EditorSettings } from "@features/settings/model";
import {
	Annotation,
	AutoIndent,
	AutoTateChuYoko,
	EmphasisDot,
	FocusMode,
	Ruby,
	SearchAndReplace,
	TateChuYoko,
} from "@shared/lib/tiptap";
import { useMemo } from "react";

type Params = {
	editorSettings: EditorSettings;
	isVertical: boolean;
};

export const useWritingModeExtensions = ({
	editorSettings,
	isVertical,
}: Params) => {
	return useMemo(
		() => [
			Ruby.configure({
				displayMode: editorSettings.markupDisplayMode,
			}),
			EmphasisDot.configure({
				displayMode: editorSettings.markupDisplayMode,
			}),
			TateChuYoko,
			Annotation,
			AutoIndent.configure({
				enabled: editorSettings.autoIndent,
			}),
			FocusMode.configure({
				enabled: editorSettings.focusMode,
			}),
			AutoTateChuYoko.configure({
				enabled: isVertical,
			}),
			SearchAndReplace,
		],
		[
			editorSettings.markupDisplayMode,
			editorSettings.autoIndent,
			editorSettings.focusMode,
			isVertical,
		],
	);
};
