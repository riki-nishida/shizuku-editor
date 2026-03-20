import { useCallback, useEffect, useRef, useState } from "react";
import { generateExportPreview } from "../../model/export/commands";
import type {
	ExportFormat,
	ExportSettings,
	WritingMode,
} from "../../model/export/types";

type UseExportPreviewProps = {
	workId: string | null;
	selectedSceneIds: Set<string>;
	selectedChapterIds: string[];
	settings: ExportSettings;
};

type PreviewSnapshot = {
	content: string;
	format: ExportFormat;
	writingMode: WritingMode;
};

const EMPTY_SNAPSHOT: PreviewSnapshot = {
	content: "",
	format: "txt",
	writingMode: "horizontal",
};

const resolveWritingMode = (settings: ExportSettings): WritingMode =>
	settings.format === "txt" || settings.format === "pdf"
		? "horizontal"
		: settings.writingMode;

export const useExportPreview = ({
	workId,
	selectedSceneIds,
	selectedChapterIds,
	settings,
}: UseExportPreviewProps) => {
	const [snapshot, setSnapshot] = useState<PreviewSnapshot>(EMPTY_SNAPSHOT);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchPreview = useCallback(async () => {
		if (!workId || selectedSceneIds.size === 0) {
			setSnapshot(EMPTY_SNAPSHOT);
			return;
		}

		const result = await generateExportPreview({
			workId,
			format: settings.format,
			sceneIds: Array.from(selectedSceneIds),
			chapterIds: selectedChapterIds,
			includeChapterTitles: settings.includeChapterTitles,
			includeSceneTitles: settings.includeSceneTitles,
			includeSeparators: settings.includeSeparators,
			rubyMode: settings.rubyMode,
			autoIndent: settings.autoIndent,
		});

		if (result.ok) {
			setSnapshot({
				content: result.value.content,
				format: settings.format,
				writingMode: resolveWritingMode(settings),
			});
		} else {
			setSnapshot(EMPTY_SNAPSHOT);
		}
	}, [workId, selectedSceneIds, selectedChapterIds, settings]);

	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			fetchPreview();
		}, 300);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [fetchPreview]);

	return {
		previewContent: snapshot.content,
		previewFormat: snapshot.format,
		previewWritingMode: snapshot.writingMode,
		refreshPreview: fetchPreview,
	};
};
