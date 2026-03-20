import type { EditorSettings } from "@features/settings/model";
import type React from "react";
import { useMemo } from "react";

const PRESET_FONT_FAMILIES: Record<string, string> = {
	system: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	serif:
		'"游明朝 Medium", "Yu Mincho Medium", "游明朝", "Yu Mincho", "YuMincho", "ヒラギノ明朝 ProN", "Hiragino Mincho ProN", serif',
};

const resolveFontFamily = (fontFamily: string): string => {
	return (
		PRESET_FONT_FAMILIES[fontFamily] ??
		`"${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
	);
};

export const useEditorStyle = (editorSettings: EditorSettings) => {
	return useMemo(() => {
		const style: React.CSSProperties = {
			fontSize: `${editorSettings.fontSize}px`,
			lineHeight: editorSettings.lineHeight,
			fontFamily: resolveFontFamily(editorSettings.fontFamily),
		};

		if (editorSettings.writingMode === "vertical") {
			style.writingMode = "vertical-rl";
			style.textOrientation = "upright";

			style.textAlign = "start";

			style.letterSpacing = "0.05em";

			style.lineHeight = 2.2;
		}

		return style;
	}, [
		editorSettings.fontFamily,
		editorSettings.fontSize,
		editorSettings.lineHeight,
		editorSettings.writingMode,
	]);
};
