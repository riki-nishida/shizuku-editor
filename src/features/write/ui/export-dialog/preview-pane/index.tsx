import type { ExportFormat, WritingMode } from "../../../model/export/types";
import styles from "./styles.module.css";

type PreviewPaneProps = {
	previewContent: string;
	writingMode: WritingMode;
	format: ExportFormat;
};

export const PreviewPane = ({
	previewContent,
	writingMode,
	format,
}: PreviewPaneProps) => {
	const isVertical = writingMode === "vertical";
	const isHtmlPreview = format !== "txt";

	return (
		<div
			className={`${styles.preview} ${isVertical ? styles.vertical : styles.horizontal}`}
		>
			<div
				className={`${styles.content} ${isHtmlPreview ? styles.htmlContent : styles.textContent}`}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: preview HTML from backend
				dangerouslySetInnerHTML={{ __html: previewContent }}
			/>
		</div>
	);
};
