import { useAppInitialize } from "@app/hooks/use-app-initialize";
import { useAutoBackup } from "@app/hooks/use-auto-backup";
import { useCloseHandler } from "@app/hooks/use-close-handler";
import { useMenuEvents } from "@app/hooks/use-menu-events";
import { usePanelSizes } from "@app/hooks/use-panel-sizes";
import { usePanelVisibility } from "@app/hooks/use-panel-visibility";
import { usePersistSelection } from "@app/hooks/use-persist-selection";
import { useUpdateCheck } from "@app/hooks/use-update-check";
import { Splitter } from "@ark-ui/react/splitter";
import { AboutDialog, HelpDialog } from "@features/help";
import { SettingsDialog } from "@features/settings";
import { ExportDialog } from "@features/write";
import { InspectorPanel, MainArea, Sidebar, TitleBar } from "@layout/index";
import { PANEL_CONSTRAINTS } from "@shared/constants/layout";
import {
	aboutDialogOpenAtom,
	exportDialogOpenAtom,
	keyboardShortcutsDialogOpenAtom,
	settingsDialogOpenAtom,
} from "@shared/store/ui";
import { ToastContainer } from "@shared/ui/toast";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import styles from "./App.module.css";

export default function App() {
	const { t } = useTranslation();
	const { showSidebar, showInspector, inspectorCollapsed } =
		usePanelVisibility();
	const { effectiveSizes, handleResize, handleResizeEnd } = usePanelSizes();
	const [settingsOpen, setSettingsOpen] = useAtom(settingsDialogOpenAtom);
	const [exportOpen, setExportOpen] = useAtom(exportDialogOpenAtom);
	const [shortcutsOpen, setShortcutsOpen] = useAtom(
		keyboardShortcutsDialogOpenAtom,
	);
	const [aboutOpen, setAboutOpen] = useAtom(aboutDialogOpenAtom);

	const { isInitialized } = useAppInitialize();
	useMenuEvents();
	usePersistSelection();
	useAutoBackup();
	useCloseHandler();
	useUpdateCheck();

	if (!isInitialized) {
		return (
			<div className={styles.root} style={{ visibility: "hidden" }}>
				<TitleBar />
			</div>
		);
	}

	return (
		<div className={styles.root}>
			<ToastContainer />
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
			<ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
			<HelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
			<AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
			<TitleBar />
			<div className={styles.shell}>
				<Splitter.Root
					className={styles.splitter}
					orientation="horizontal"
					size={effectiveSizes}
					onResize={handleResize}
					onResizeEnd={handleResizeEnd}
					panels={[
						{
							id: "sidebar",
							minSize: showSidebar ? PANEL_CONSTRAINTS.sidebar.minSize : 0,
							maxSize: showSidebar ? PANEL_CONSTRAINTS.sidebar.maxSize : 0,
						},
						{ id: "main", minSize: PANEL_CONSTRAINTS.main.minSize },
						{
							id: "inspector",
							minSize:
								showInspector && !inspectorCollapsed
									? PANEL_CONSTRAINTS.inspector.minSize
									: 0,
							maxSize:
								showInspector && !inspectorCollapsed
									? PANEL_CONSTRAINTS.inspector.maxSize
									: 0,
						},
					]}
				>
					<Splitter.Panel id="sidebar" data-hidden={!showSidebar || undefined}>
						{showSidebar && <Sidebar />}
					</Splitter.Panel>
					<Splitter.ResizeTrigger
						id="sidebar:main"
						className={styles.resizeTrigger}
						data-hidden={!showSidebar || undefined}
						aria-label={t("common.resizeSidebar")}
					/>
					<Splitter.Panel id="main" className={styles.mainPanel}>
						<MainArea />
					</Splitter.Panel>
					<Splitter.ResizeTrigger
						id="main:inspector"
						className={styles.resizeTrigger}
						data-hidden={!showInspector || undefined}
						aria-label={t("common.resizeInspector")}
					/>
					<Splitter.Panel
						id="inspector"
						className={styles.inspectorPanel}
						data-hidden={!showInspector || undefined}
					>
						{showInspector && <InspectorPanel />}
					</Splitter.Panel>
				</Splitter.Root>
			</div>
		</div>
	);
}
