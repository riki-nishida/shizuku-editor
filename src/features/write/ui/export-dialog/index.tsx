import { Portal } from "@ark-ui/react/portal";
import { selectedWorkAtom } from "@features/work";
import { Dialog } from "@shared/ui/dialog";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PreviewPane } from "./preview-pane";
import { SettingsPanel } from "./settings-panel";
import styles from "./styles.module.css";
import { useExportAction } from "./use-export-action";
import { useExportPreview } from "./use-export-preview";
import { useExportSceneSelection } from "./use-export-scene-selection";
import { useExportSettings } from "./use-export-settings";

type ExportDialogProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export const ExportDialog = ({
	open = false,
	onOpenChange,
}: ExportDialogProps) => {
	const { t } = useTranslation();
	const setOpen = onOpenChange ?? (() => {});

	const selectedWork = useAtomValue(selectedWorkAtom);
	const workId = selectedWork?.id ?? null;
	const workName = selectedWork?.name ?? "";

	const { settings, updateSetting } = useExportSettings(open);

	const {
		chapters,
		selectedSceneIds,
		selectedChapterIds,
		sceneCount,
		totalWordCount,
		allCheckedState,
		expandedChapters,
		toggleScene,
		toggleChapter,
		selectAll,
		deselectAll,
		getChapterCheckedState,
		toggleExpanded,
	} = useExportSceneSelection(open);

	const { isExporting, canExport, handleExport } = useExportAction({
		workId,
		selectedSceneIds,
		selectedChapterIds,
		onSuccess: () => setOpen(false),
	});

	const { previewContent, previewFormat, previewWritingMode } =
		useExportPreview({
			workId,
			selectedSceneIds,
			selectedChapterIds,
			settings,
		});

	const [panelCollapsed, setPanelCollapsed] = useState(false);

	const onExport = () => {
		handleExport({
			exportFormat: settings.format,
			exportMode: settings.mode,
			includeChapterTitles: settings.includeChapterTitles,
			includeSceneTitles: settings.includeSceneTitles,
			includeSeparators: settings.includeSeparators,
			rubyMode: settings.rubyMode,
			workName: workName,
			pageSize: settings.pageSize,
			writingMode: settings.writingMode,
			author: settings.author,
			autoIndent: settings.autoIndent,
		});
	};

	return (
		<Dialog.ControlledRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
			{open && (
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content className={styles.content}>
							<Dialog.Header
								title={t("common.export")}
								onClose={() => setOpen(false)}
							/>

							<div
								className={panelCollapsed ? styles.bodyCollapsed : styles.body}
							>
								<SettingsPanel
									settings={settings}
									updateSetting={updateSetting}
									sceneCount={sceneCount}
									totalWordCount={totalWordCount}
									collapsed={panelCollapsed}
									onToggleCollapse={() => setPanelCollapsed((prev) => !prev)}
									onExport={onExport}
									isExporting={isExporting}
									canExport={canExport()}
									chapters={chapters}
									selectedSceneIds={selectedSceneIds}
									expandedChapters={expandedChapters}
									allCheckedState={allCheckedState}
									getChapterCheckedState={getChapterCheckedState}
									onToggleScene={toggleScene}
									onToggleChapter={toggleChapter}
									onToggleExpanded={toggleExpanded}
									onSelectAll={selectAll}
									onDeselectAll={deselectAll}
								/>

								<PreviewPane
									previewContent={previewContent}
									writingMode={previewWritingMode}
									format={previewFormat}
								/>
							</div>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			)}
		</Dialog.ControlledRoot>
	);
};
