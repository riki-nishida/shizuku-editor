import { KnowledgeEditor, KnowledgeList } from "@features/knowledge";
import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import { Editor } from "@features/write";
import { TitleBarContent } from "@layout/title-bar";
import { isMacOS } from "@shared/lib";
import clsx from "clsx";
import { OpenBook } from "iconoir-react";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { SplitViewContainer } from "./split-view";
import { useSplitViewSync } from "./split-view/use-split-view-sync";
import styles from "./styles.module.css";

export const MainArea = () => {
	const { t } = useTranslation();
	useSplitViewSync();

	const selectedNode = useAtomValue(selectedNodeAtom);
	const selectedWork = useAtomValue(selectedWorkAtom);
	const isKnowledgeMode = selectedNode?.type === "knowledge";
	const selectedKnowledgeId =
		selectedNode?.type === "knowledge" ? selectedNode.id : null;
	const workId = selectedWork?.id ?? null;
	const isMac = isMacOS();

	if (!selectedWork) {
		return (
			<section
				className={clsx(styles.container, isMac && styles.macOS)}
				aria-label={t("mainArea.mainArea")}
				data-tour-id="main-area"
			>
				<header className={styles.titleBarHeader}>
					{isMac && (
						<div className={styles.titleBarDragRegion} data-tauri-drag-region />
					)}
					<TitleBarContent />
				</header>
				<div className={styles.placeholder}>
					<div className={styles.placeholderIcon}>
						<OpenBook width={48} height={48} />
					</div>
					<p className={styles.placeholderText}>
						{t("mainArea.selectOrCreateWork")}
					</p>
				</div>
			</section>
		);
	}

	if (isKnowledgeMode) {
		return (
			<section
				className={clsx(styles.container, isMac && styles.macOS)}
				aria-label={t("mainArea.mainArea")}
				data-tour-id="main-area"
			>
				<header className={styles.titleBarHeader}>
					{isMac && (
						<div className={styles.titleBarDragRegion} data-tauri-drag-region />
					)}
					<TitleBarContent />
				</header>
				<div className={styles.knowledgeLayout}>
					<div className={styles.knowledgeListColumn}>
						<KnowledgeList workId={workId} />
					</div>
					<div className={styles.knowledgeEditorColumn}>
						<KnowledgeEditor knowledgeId={selectedKnowledgeId ?? undefined} />
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			className={clsx(styles.container, isMac && styles.macOS)}
			aria-label={t("mainArea.mainArea")}
			data-tour-id="main-area"
		>
			<header className={styles.titleBarHeader}>
				{isMac && (
					<div className={styles.titleBarDragRegion} data-tauri-drag-region />
				)}
				<TitleBarContent />
			</header>
			<SplitViewContainer>
				<Editor />
			</SplitViewContainer>
		</section>
	);
};
