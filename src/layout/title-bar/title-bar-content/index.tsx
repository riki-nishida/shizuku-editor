import { usePanelVisibility } from "@app/hooks/use-panel-visibility";
import { editorSettingsAtom } from "@features/settings";
import { selectedNodeAtom, WorkMenu } from "@features/work";
import { canRedoAtom, canUndoAtom, editorCommandsAtom } from "@features/write";
import { useIsJapanese } from "@shared/hooks/use-is-japanese";
import {
	isSplitActiveAtom,
	setSplitDirectionAtom,
	toggleSplitViewAtom,
} from "@shared/store/split-view";
import {
	inspectorCollapsedAtom,
	searchPanelOpenAtom,
	toggleInspectorCollapsedAtom,
} from "@shared/store/ui";
import { Breadcrumb } from "@shared/ui/breadcrumb";
import { IconButton } from "@shared/ui/icon-button";
import {
	NavArrowDown,
	NavArrowRight,
	NavArrowUp,
	Redo,
	Search,
	SidebarExpand,
	Undo,
	ViewColumns2,
} from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";
import { SymbolPopover } from "./symbol-popover";
import { useBreadcrumb } from "./use-breadcrumb";
import { useSceneNavigation } from "./use-scene-navigation";

export const TitleBarContent = () => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	const breadcrumbItems = useBreadcrumb();
	const setSearchOpen = useSetAtom(searchPanelOpenAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);

	const editorSettings = useAtomValue(editorSettingsAtom);
	const isVertical = editorSettings.writingMode === "vertical";

	const isSplitActive = useAtomValue(isSplitActiveAtom);
	const toggleSplitView = useSetAtom(toggleSplitViewAtom);
	const setSplitDirection = useSetAtom(setSplitDirectionAtom);

	useEffect(() => {
		if (isVertical && isSplitActive) {
			void setSplitDirection("none");
		}
	}, [isVertical, isSplitActive, setSplitDirection]);

	const { showInspector } = usePanelVisibility();
	const inspectorCollapsed = useAtomValue(inspectorCollapsedAtom);
	const toggleInspector = useSetAtom(toggleInspectorCollapsedAtom);

	const editorCommands = useAtomValue(editorCommandsAtom);
	const canUndo = useAtomValue(canUndoAtom);
	const canRedo = useAtomValue(canRedoAtom);

	const { canGoPrev, canGoNext, goPrev, goNext } = useSceneNavigation();

	const isScene = selectedNode?.type === "scene";

	const pathItems = useMemo(() => {
		const chapterItem = breadcrumbItems.find((item) => item.type === "chapter");
		const sceneItem = breadcrumbItems.find((item) => item.type === "scene");

		return breadcrumbItems.filter((item) => {
			if (item.type === "work") return false;
			if (item.type === "scene" && chapterItem && sceneItem) {
				return chapterItem.label !== sceneItem.label;
			}
			return true;
		});
	}, [breadcrumbItems]);

	return (
		<div className={styles.container}>
			<div className={styles.navigation}>
				<WorkMenu />
				{pathItems.length > 0 && (
					<>
						<span className={styles.separator}>
							<NavArrowRight width={16} height={16} />
						</span>
						<Breadcrumb items={pathItems} />
					</>
				)}
			</div>
			<div className={styles.actions}>
				{isScene && (
					<div className={styles.actionGroup}>
						<IconButton
							tooltip={t("titleBar.undoTooltip")}
							onClick={() => editorCommands.undo()}
							disabled={!canUndo}
						>
							<Undo width={16} height={16} />
						</IconButton>
						<IconButton
							tooltip={t("titleBar.redoTooltip")}
							onClick={() => editorCommands.redo()}
							disabled={!canRedo}
						>
							<Redo width={16} height={16} />
						</IconButton>
					</div>
				)}

				{isScene && isJapanese && <SymbolPopover />}

				{isScene && (
					<>
						<span className={styles.actionDivider} />
						<div className={styles.actionGroup}>
							<IconButton
								tooltip={t("titleBar.prevScene")}
								onClick={goPrev}
								disabled={!canGoPrev}
							>
								<NavArrowUp width={16} height={16} />
							</IconButton>
							<IconButton
								tooltip={t("titleBar.nextScene")}
								onClick={goNext}
								disabled={!canGoNext}
							>
								<NavArrowDown width={16} height={16} />
							</IconButton>
						</div>
					</>
				)}

				{isScene && (
					<>
						<span className={styles.actionDivider} />
						<div className={styles.actionGroup}>
							<IconButton
								tooltip={
									isVertical
										? t("titleBar.splitDisabledVertical")
										: isSplitActive
											? t("titleBar.splitOff")
											: t("titleBar.splitOn")
								}
								onClick={() => toggleSplitView()}
								active={isSplitActive}
								disabled={isVertical}
							>
								<ViewColumns2 width={16} height={16} />
							</IconButton>
							<IconButton
								tooltip={t("titleBar.searchTooltip")}
								onClick={() => setSearchOpen(true)}
							>
								<Search width={16} height={16} />
							</IconButton>
						</div>
					</>
				)}

				{showInspector && inspectorCollapsed && (
					<>
						<span className={styles.actionDivider} />
						<IconButton
							tooltip={t("titleBar.expandInspector")}
							onClick={() => toggleInspector()}
						>
							<SidebarExpand width={16} height={16} />
						</IconButton>
					</>
				)}
			</div>
		</div>
	);
};
