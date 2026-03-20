import { editorSettingsAtom } from "@features/settings";
import { editorInstanceAtom } from "@features/write/model/editor/store";
import { liveWordCountAtom } from "@shared/store/ui";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type Props = {
	wordCount?: number;
};

export const EditorFooter = ({ wordCount: wordCountProp }: Props) => {
	const { t } = useTranslation();
	const globalWordCount = useAtomValue(liveWordCountAtom);
	const wordCount = wordCountProp ?? globalWordCount;
	const editorSettings = useAtomValue(editorSettingsAtom);
	const editor = useAtomValue(editorInstanceAtom);
	const [selectionCount, setSelectionCount] = useState<number>(0);
	const isVertical = editorSettings.writingMode === "vertical";

	useEffect(() => {
		if (!editor) {
			setSelectionCount(0);
			return;
		}

		const updateSelectionCount = () => {
			const { from, to, empty } = editor.state.selection;
			if (empty) {
				setSelectionCount(0);
				return;
			}
			const selectedText = editor.state.doc.textBetween(from, to, "");

			const count = selectedText.replace(/\s+/g, "").length;
			setSelectionCount(count);
		};

		updateSelectionCount();

		editor.on("selectionUpdate", updateSelectionCount);

		return () => {
			editor.off("selectionUpdate", updateSelectionCount);
		};
	}, [editor]);

	return (
		<footer
			className={`${styles.footer}${isVertical ? ` ${styles.footerVertical}` : ""}`}
		>
			<div className={styles.wordCount}>
				<span className={styles.count}>{wordCount.toLocaleString()}</span>
				<span className={styles.label}>{t("write.footer.charCount")}</span>
				{selectionCount > 0 && (
					<>
						<span className={styles.separator}>│</span>
						<span className={styles.selectionLabel}>
							{t("write.footer.selected")}
						</span>
						<span className={styles.selectionCount}>
							{selectionCount.toLocaleString()}
						</span>
						<span className={styles.label}>{t("write.footer.charCount")}</span>
					</>
				)}
			</div>

			<div className={styles.modeIndicators}>
				{editorSettings.focusMode && (
					<span className={styles.modeIndicator}>
						{t("write.footer.focusMode")}
					</span>
				)}
			</div>
		</footer>
	);
};
