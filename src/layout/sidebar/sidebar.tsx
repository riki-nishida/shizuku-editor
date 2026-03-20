import { Splitter } from "@ark-ui/react/splitter";
import {
	KnowledgeTypeNav,
	type KnowledgeTypeNavHandle,
} from "@features/knowledge";
import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import {
	Outline,
	openSearchPanelAtom,
	outlineNodesAtom,
	useOutlineHandlers,
	WorkStatisticsFooter,
} from "@features/write";
import { useFullscreen } from "@shared/hooks/use-fullscreen";
import { isMacOS } from "@shared/lib";
import {
	saveSidebarSectionRatioAtom,
	sidebarSectionRatioAtom,
	sidebarSectionsAtom,
	toggleSidebarSectionAtom,
} from "@shared/store";
import { exportDialogOpenAtom } from "@shared/store/ui";
import { IconButton } from "@shared/ui/icon-button";
import { BookStack, List, Plus, Search, Upload } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarSection } from "./sidebar-section";
import styles from "./styles.module.css";

const MIN_SECTION_SIZE = 20;

export const Sidebar = () => {
	const { t } = useTranslation();
	const sections = useAtomValue(sidebarSectionsAtom);
	const toggleSection = useSetAtom(toggleSidebarSectionAtom);
	const selectedWork = useAtomValue(selectedWorkAtom);
	const workId = selectedWork?.id ?? null;

	const nodes = useAtomValue(outlineNodesAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const { handleAddChapter } = useOutlineHandlers({
		workId,
		nodes,
		selectedNodeId: selectedNode?.id ?? null,
	});

	const openSearchPanel = useSetAtom(openSearchPanelAtom);
	const setExportDialogOpen = useSetAtom(exportDialogOpenAtom);

	const knowledgeTypeNavRef = useRef<KnowledgeTypeNavHandle>(null);

	const sectionRatio = useAtomValue(sidebarSectionRatioAtom);
	const saveSectionRatio = useSetAtom(saveSidebarSectionRatioAtom);
	const [liveSizes, setLiveSizes] = useState<number[] | null>(null);

	const handleResize = useCallback((details: { size: number[] }) => {
		setLiveSizes(details.size);
	}, []);

	const handleResizeEnd = useCallback(
		(details: { size: number[] }) => {
			setLiveSizes(null);
			const newRatio = details.size[0] / 100;
			void saveSectionRatio(newRatio);
		},
		[saveSectionRatio],
	);

	const panelSizes = useMemo(() => {
		if (liveSizes) return liveSizes;
		const outlinePercent = sectionRatio * 100;
		const materialsPercent = 100 - outlinePercent;
		return [outlinePercent, materialsPercent];
	}, [sectionRatio, liveSizes]);

	const isFullscreen = useFullscreen();
	const showTrafficLightArea = isMacOS() && !isFullscreen;

	const hasWork = selectedWork !== null;
	const bothSectionsOpen = hasWork && sections.outline && sections.materials;

	const outlineSection = (
		<SidebarSection
			title={t("sidebar.manuscript")}
			icon={<List width={14} height={14} />}
			isOpen={sections.outline}
			onToggle={() => toggleSection("outline")}
			actions={
				<>
					<IconButton
						tooltip={t("sidebar.search")}
						onClick={() => openSearchPanel()}
					>
						<Search width={14} height={14} />
					</IconButton>
					<IconButton
						tooltip={t("sidebar.export")}
						onClick={() => setExportDialogOpen(true)}
					>
						<Upload width={14} height={14} />
					</IconButton>
					<IconButton
						tooltip={t("sidebar.addChapter")}
						onClick={handleAddChapter}
					>
						<Plus width={14} height={14} />
					</IconButton>
				</>
			}
		>
			<Outline workId={workId} />
		</SidebarSection>
	);

	const materialsSection = (
		<SidebarSection
			title={t("sidebar.materials")}
			icon={<BookStack width={14} height={14} />}
			isOpen={sections.materials}
			onToggle={() => toggleSection("materials")}
			actions={
				<IconButton
					tooltip={t("sidebar.addCategory")}
					onClick={() => knowledgeTypeNavRef.current?.startAddType()}
				>
					<Plus width={14} height={14} />
				</IconButton>
			}
		>
			<KnowledgeTypeNav
				ref={knowledgeTypeNavRef}
				workId={workId}
				showHeader={false}
			/>
		</SidebarSection>
	);

	return (
		<aside
			className={styles.container}
			aria-label={t("sidebar.sidebar")}
			data-tour-id="sidebar"
		>
			{showTrafficLightArea && (
				<div className={styles.dragRegion} data-tauri-drag-region />
			)}
			<div className={styles.sections}>
				{!hasWork ? null : bothSectionsOpen ? (
					<Splitter.Root
						className={styles.splitterRoot}
						orientation="vertical"
						size={panelSizes}
						onResize={handleResize}
						onResizeEnd={handleResizeEnd}
						panels={[
							{ id: "outline", minSize: MIN_SECTION_SIZE },
							{ id: "materials", minSize: MIN_SECTION_SIZE },
						]}
					>
						<Splitter.Panel id="outline" className={styles.splitterPanel}>
							<SidebarSection
								title={t("sidebar.manuscript")}
								icon={<List width={14} height={14} />}
								isOpen={sections.outline}
								onToggle={() => toggleSection("outline")}
								inSplitter
								actions={
									<>
										<IconButton
											tooltip={t("sidebar.search")}
											onClick={() => openSearchPanel()}
										>
											<Search width={14} height={14} />
										</IconButton>
										<IconButton
											tooltip={t("sidebar.export")}
											onClick={() => setExportDialogOpen(true)}
										>
											<Upload width={14} height={14} />
										</IconButton>
										<IconButton
											tooltip={t("sidebar.addChapterShort")}
											onClick={handleAddChapter}
										>
											<Plus width={14} height={14} />
										</IconButton>
									</>
								}
							>
								<Outline workId={workId} />
							</SidebarSection>
						</Splitter.Panel>
						<Splitter.ResizeTrigger
							id="outline:materials"
							className={styles.resizeTrigger}
							aria-label={t("sidebar.adjustSectionSize")}
						/>
						<Splitter.Panel id="materials" className={styles.splitterPanel}>
							<SidebarSection
								title={t("sidebar.materials")}
								icon={<BookStack width={14} height={14} />}
								isOpen={sections.materials}
								onToggle={() => toggleSection("materials")}
								inSplitter
								actions={
									<IconButton
										tooltip={t("sidebar.addCategory")}
										onClick={() => knowledgeTypeNavRef.current?.startAddType()}
									>
										<Plus width={14} height={14} />
									</IconButton>
								}
							>
								<KnowledgeTypeNav
									ref={knowledgeTypeNavRef}
									workId={workId}
									showHeader={false}
								/>
							</SidebarSection>
						</Splitter.Panel>
					</Splitter.Root>
				) : (
					<>
						{outlineSection}
						{materialsSection}
					</>
				)}
			</div>
			<WorkStatisticsFooter workId={workId} />
			<SidebarFooter />
		</aside>
	);
};
