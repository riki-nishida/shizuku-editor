import { Tabs } from "@ark-ui/react/tabs";
import {
	collapseAllInspectorSectionsAtom,
	expandAllInspectorSectionsAtom,
	inspectorTabAtom,
	loadInspectorSectionsAtom,
	loadInspectorTabAtom,
	setInspectorTabAtom,
} from "@features/inspector/model";
import { selectedWorkAtom } from "@features/work";
import {
	reloadSceneContentAtom,
	type Scene,
	selectedSceneAtom,
	useEditorState,
	VersionHistoryPanel,
	type VersionHistoryPanelHandle,
} from "@features/write";
import { toggleInspectorCollapsedAtom } from "@shared/store/ui";
import { ContextMenu } from "@shared/ui/context-menu";
import { IconButton } from "@shared/ui/icon-button";
import { Tooltip } from "@shared/ui/tooltip";
import {
	BookStack,
	InfoCircle,
	MediaImageFolder,
	Plus,
	SidebarCollapse,
} from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { AnnotationsPanel } from "./annotations-panel";
import { CollapsibleSection } from "./collapsible-section";
import { RelatedKnowledgePanel } from "./related-knowledge-panel";
import { SceneImagePanel } from "./scene-image-panel";
import { StatsPanel } from "./stats-panel";
import styles from "./styles.module.css";
import { SynopsisPanel } from "./synopsis-panel";

export const Inspector = () => {
	const selectedScene = useAtomValue(selectedSceneAtom);
	const selectedWork = useAtomValue(selectedWorkAtom);
	const loadInspectorSections = useSetAtom(loadInspectorSectionsAtom);
	const loadInspectorTab = useSetAtom(loadInspectorTabAtom);

	useEffect(() => {
		loadInspectorSections();
		loadInspectorTab();
	}, [loadInspectorSections, loadInspectorTab]);

	if (!selectedScene || !selectedWork) return null;

	return (
		<InspectorContent
			key={selectedScene.id}
			scene={selectedScene}
			workId={selectedWork.id}
		/>
	);
};

type InspectorContentProps = {
	scene: Scene;
	workId: string;
};

function InspectorContent({ scene, workId }: InspectorContentProps) {
	const { t } = useTranslation();
	const editorState = useEditorState(scene);
	const reloadSceneContent = useSetAtom(reloadSceneContentAtom);
	const expandAll = useSetAtom(expandAllInspectorSectionsAtom);
	const collapseAll = useSetAtom(collapseAllInspectorSectionsAtom);
	const toggleInspector = useSetAtom(toggleInspectorCollapsedAtom);
	const activeTab = useAtomValue(inspectorTabAtom);
	const setInspectorTab = useSetAtom(setInspectorTabAtom);
	const versionHistoryRef = useRef<VersionHistoryPanelHandle>(null);

	const handleVersionRestore = useCallback(() => {
		reloadSceneContent(scene.id);
	}, [reloadSceneContent, scene.id]);

	const handleAddVersion = useCallback(() => {
		versionHistoryRef.current?.quickSave();
	}, []);

	const contextMenuItems = [
		{ value: "expandAll", label: t("common.expandAll") },
		{ value: "collapseAll", label: t("common.collapseAll") },
	];

	const handleContextMenuSelect = useCallback(
		(details: { value: string }) => {
			switch (details.value) {
				case "expandAll":
					expandAll();
					break;
				case "collapseAll":
					collapseAll();
					break;
			}
		},
		[expandAll, collapseAll],
	);

	return (
		<ContextMenu items={contextMenuItems} onSelect={handleContextMenuSelect}>
			<section className={styles.panel} aria-label={t("inspector.inspector")}>
				<Tabs.Root
					value={activeTab}
					onValueChange={(e) => setInspectorTab(e.value)}
					className={styles.tabs}
				>
					<Tabs.List className={styles.tabList}>
						<Tooltip content={t("inspector.details")}>
							<Tabs.Trigger
								value="meta"
								className={styles.tabTrigger}
								aria-label={t("inspector.details")}
							>
								<InfoCircle width={16} height={16} />
							</Tabs.Trigger>
						</Tooltip>
						<Tooltip content={t("inspector.relatedMaterials")}>
							<Tabs.Trigger
								value="knowledge"
								className={styles.tabTrigger}
								aria-label={t("inspector.relatedMaterials")}
							>
								<BookStack width={16} height={16} />
							</Tabs.Trigger>
						</Tooltip>
						<Tooltip content={t("inspector.referenceImages")}>
							<Tabs.Trigger
								value="images"
								className={styles.tabTrigger}
								aria-label={t("inspector.referenceImages")}
							>
								<MediaImageFolder width={16} height={16} />
							</Tabs.Trigger>
						</Tooltip>
						<div className={styles.tabListSpacer} />
						<IconButton
							tooltip={t("inspector.closeInspector")}
							onClick={() => toggleInspector()}
						>
							<SidebarCollapse width={16} height={16} />
						</IconButton>
					</Tabs.List>

					<Tabs.Content value="meta" className={styles.tabContent}>
						<div className={styles.content}>
							<div className={styles.section}>
								<StatsPanel
									contentText={
										editorState.draftContentText || scene.content_text || ""
									}
									updatedAt={scene.updated_at}
								/>
							</div>
							<div className={styles.divider} />
							<div className={styles.section}>
								<SynopsisPanel
									sceneId={scene.id}
									initialSynopsis={scene.synopsis}
								/>
							</div>
							<div className={styles.divider} />
							<CollapsibleSection
								sectionId="annotations"
								title={t("inspector.comments")}
							>
								<AnnotationsPanel />
							</CollapsibleSection>
							<CollapsibleSection
								sectionId="versionHistory"
								title={t("inspector.versionHistory")}
								action={
									<button
										type="button"
										className={styles.addButton}
										onClick={(e) => {
											e.stopPropagation();
											handleAddVersion();
										}}
										title={t("versionHistory.saveVersion")}
									>
										<Plus width={14} height={14} />
									</button>
								}
							>
								<VersionHistoryPanel
									ref={versionHistoryRef}
									sceneId={scene.id}
									onRestore={handleVersionRestore}
								/>
							</CollapsibleSection>
						</div>
					</Tabs.Content>

					<Tabs.Content value="knowledge" className={styles.tabContent}>
						<div className={styles.content}>
							<RelatedKnowledgePanel sceneId={scene.id} workId={workId} />
						</div>
					</Tabs.Content>

					<Tabs.Content value="images" className={styles.tabContent}>
						<div className={styles.content}>
							<SceneImagePanel sceneId={scene.id} />
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</section>
		</ContextMenu>
	);
}
