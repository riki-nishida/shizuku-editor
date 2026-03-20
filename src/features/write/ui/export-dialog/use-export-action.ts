import type { Result } from "@shared/lib/commands";
import { useToast } from "@shared/lib/toast";
import { open, save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	exportDocx,
	exportEpub,
	exportPdf,
	exportTxt,
} from "../../model/export/commands";
import type {
	DocxExportPayload,
	EpubExportPayload,
	ExportFormat,
	ExportMode,
	ExportResult,
	PdfExportPayload,
	PdfPageSize,
	RubyMode,
	TxtExportPayload,
	WritingMode,
} from "../../model/export/types";

type ExportOptions = {
	exportFormat: ExportFormat;
	exportMode: ExportMode;
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	includeSeparators: boolean;
	rubyMode: RubyMode;
	workName: string;
	pageSize: PdfPageSize;
	writingMode: WritingMode;
	author: string;
	autoIndent: boolean;
};

type UseExportActionProps = {
	workId: string | null;
	selectedSceneIds: Set<string>;
	selectedChapterIds: string[];
	onSuccess: () => void;
};

export const useExportAction = ({
	workId,
	selectedSceneIds,
	selectedChapterIds,
	onSuccess,
}: UseExportActionProps) => {
	const { t } = useTranslation();
	const { showSuccess, showError } = useToast();
	const [isExporting, setIsExporting] = useState(false);

	const canExport = useCallback(
		() => selectedSceneIds.size > 0,
		[selectedSceneIds],
	);

	const handleExport = useCallback(
		async (options: ExportOptions) => {
			if (!workId || !canExport()) return;

			const extensionMap: Record<ExportFormat, string> = {
				txt: "txt",
				docx: "docx",
				pdf: "pdf",
				epub: "epub",
			};
			const extension = extensionMap[options.exportFormat];

			const filterNameMap: Record<ExportFormat, string> = {
				txt: t("exportDialog.textFile"),
				docx: t("exportDialog.wordDoc"),
				pdf: t("exportDialog.pdfFile"),
				epub: t("exportDialog.epubFile"),
			};

			const isSingleFile =
				options.exportMode === "single-file" ||
				options.exportFormat === "pdf" ||
				options.exportFormat === "docx" ||
				options.exportFormat === "epub";

			let exportPath: string | null;

			if (isSingleFile) {
				const defaultFileName = `${options.workName}.${extension}`;
				exportPath = await save({
					defaultPath: defaultFileName,
					filters: [
						{
							name: filterNameMap[options.exportFormat],
							extensions: [extension],
						},
					],
				});
			} else {
				const selected = await open({
					directory: true,
					multiple: false,
					title: t("exportDialog.selectFolder"),
				});
				exportPath = typeof selected === "string" ? selected : null;
			}

			if (!exportPath) return;

			setIsExporting(true);

			let exportResult: Result<ExportResult>;

			if (options.exportFormat === "txt") {
				const payload: TxtExportPayload = {
					workId: workId,
					mode: options.exportMode,
					sceneIds: Array.from(selectedSceneIds),
					chapterIds: selectedChapterIds,
					includeChapterTitles: options.includeChapterTitles,
					includeSceneTitles: options.includeSceneTitles,
					includeSeparators: options.includeSeparators,
					rubyMode: options.rubyMode,
					exportPath: exportPath,
					autoIndent: options.autoIndent,
				};
				exportResult = await exportTxt(payload);
			} else if (options.exportFormat === "pdf") {
				const payload: PdfExportPayload = {
					workId: workId,
					sceneIds: Array.from(selectedSceneIds),
					chapterIds: selectedChapterIds,
					includeChapterTitles: options.includeChapterTitles,
					includeSceneTitles: options.includeSceneTitles,
					rubyMode: options.rubyMode,
					pageSize: options.pageSize,
					exportPath: exportPath,
					autoIndent: options.autoIndent,
				};
				exportResult = await exportPdf(payload);
			} else if (options.exportFormat === "epub") {
				const payload: EpubExportPayload = {
					workId: workId,
					sceneIds: Array.from(selectedSceneIds),
					chapterIds: selectedChapterIds,
					includeChapterTitles: options.includeChapterTitles,
					includeSceneTitles: options.includeSceneTitles,
					writingMode: options.writingMode,
					author: options.author || undefined,
					exportPath: exportPath,
					autoIndent: options.autoIndent,
				};
				exportResult = await exportEpub(payload);
			} else {
				const payload: DocxExportPayload = {
					workId: workId,
					sceneIds: Array.from(selectedSceneIds),
					chapterIds: selectedChapterIds,
					includeChapterTitles: options.includeChapterTitles,
					includeSceneTitles: options.includeSceneTitles,
					writingMode: options.writingMode,
					exportPath: exportPath,
					autoIndent: options.autoIndent,
				};
				exportResult = await exportDocx(payload);
			}

			setIsExporting(false);

			if (!exportResult.ok) {
				showError(
					t("exportDialog.exportFailed", { error: exportResult.error.message }),
				);
				return;
			}

			const result = exportResult.value;
			showSuccess(t("exportDialog.exportComplete"), {
				label: t("exportDialog.openFolder"),
				onClick: () => {
					if (result.savedPaths.length > 0) {
						revealItemInDir(result.savedPaths[0]);
					}
				},
			});

			onSuccess();
		},
		[
			workId,
			canExport,
			selectedSceneIds,
			selectedChapterIds,
			showSuccess,
			showError,
			onSuccess,
			t,
		],
	);

	return {
		isExporting,
		canExport,
		handleExport,
	};
};
