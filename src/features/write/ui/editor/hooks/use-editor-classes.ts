import type { EditorSettings } from "@features/settings/model";
import { useMemo } from "react";

type Params = {
	isVertical: boolean;
	editorSettings: EditorSettings;
	verticalClassName?: string;
	additionalBaseClasses?: string[];
};

export const useEditorClasses = ({
	isVertical,
	editorSettings,
	verticalClassName,
	additionalBaseClasses,
}: Params) => {
	// biome-ignore lint/correctness/useExhaustiveDependencies: additionalBaseClasses は CSS Module の値（ビルド時確定の定数）なので依存配列から除外する
	return useMemo(() => {
		const classes = additionalBaseClasses ? [...additionalBaseClasses] : [];

		if (isVertical) {
			if (verticalClassName) {
				classes.push(verticalClassName);
			}
			classes.push("vertical");
		}

		if (editorSettings.focusMode) {
			classes.push("focus-mode");
		}

		if (editorSettings.genkoYoshiMode) {
			classes.push("genko-yoshi-mode");
		}

		if (editorSettings.typewriterMode && !editorSettings.genkoYoshiMode) {
			classes.push("typewriter-mode");
		}

		return classes.join(" ");
	}, [
		isVertical,
		verticalClassName,
		editorSettings.focusMode,
		editorSettings.typewriterMode,
		editorSettings.genkoYoshiMode,
	]);
};
