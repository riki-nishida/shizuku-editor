import { formatDate } from "@shared/lib/date";
import { Button } from "@shared/ui/button";
import { Dialog, useDialog } from "@shared/ui/dialog";
import { Tooltip } from "@shared/ui/tooltip";
import {
	Clock,
	Expand,
	Eye,
	HistoricShield,
	Text,
	Trash,
	Undo,
} from "iconoir-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { getScene } from "../../model/editor/commands";
import type { SceneVersion } from "../../model/version/types";
import { DiffView } from "./diff-view";
import styles from "./styles.module.css";
import { useVersionHistory } from "./use-version-history";

const countWords = (text: string): number => {
	return text.replace(/\s+/g, "").length;
};

type Props = {
	sceneId: string;
	onRestore: () => void;
};

export type VersionHistoryPanelHandle = {
	quickSave: () => void;
};

export const VersionHistoryPanel = forwardRef<VersionHistoryPanelHandle, Props>(
	({ sceneId, onRestore }, ref) => {
		const { t } = useTranslation();
		const {
			versions,
			isSaving,
			isRestoring,
			isDeleting,
			previewVersion,
			saveVersion,
			restoreVersion,
			deleteVersion,
			openPreview,
			closePreview,
			updateLabel,
			expandedVersionId,
			toggleExpanded,
			comparisonTarget,
			setComparisonTarget,
		} = useVersionHistory(sceneId);

		const [currentContent, setCurrentContent] = useState<string>("");
		const previewDialog = useDialog();

		const quickSave = useCallback(() => {
			saveVersion();
		}, [saveVersion]);

		useImperativeHandle(
			ref,
			() => ({
				quickSave,
			}),
			[quickSave],
		);

		useEffect(() => {
			if ((expandedVersionId || previewDialog.open) && sceneId) {
				getScene(sceneId).then((result) => {
					if (result.ok) {
						setCurrentContent(result.value.content_text);
					}
				});
			}
		}, [expandedVersionId, previewDialog.open, sceneId]);

		const handleRestoreClick = useCallback(
			async (versionId: string) => {
				const success = await restoreVersion(versionId);
				if (success) {
					onRestore();
				}
				return success;
			},
			[restoreVersion, onRestore],
		);

		const handlePreviewClick = useCallback(
			(version: SceneVersion) => {
				openPreview(version);
				previewDialog.setOpen(true);
			},
			[openPreview, previewDialog],
		);

		const handlePreviewClose = useCallback(() => {
			closePreview();
			previewDialog.setOpen(false);
		}, [closePreview, previewDialog]);

		const getDiffTexts = useCallback(
			(version: SceneVersion) => {
				if (comparisonTarget === "previous") {
					const currentIndex = versions.findIndex((v) => v.id === version.id);
					const previousVersion = versions[currentIndex + 1];
					if (previousVersion) {
						return {
							oldText: previousVersion.content_text,
							newText: version.content_text,
						};
					}

					return {
						oldText: version.content_text,
						newText: currentContent,
					};
				}
				return {
					oldText: version.content_text,
					newText: currentContent,
				};
			},
			[versions, currentContent, comparisonTarget],
		);

		const isPreviousDisabled = useCallback(
			(versionId: string) => {
				const index = versions.findIndex((v) => v.id === versionId);
				return index === versions.length - 1;
			},
			[versions],
		);

		return (
			<div className={styles.container}>
				<div className={styles.list}>
					{versions.length === 0 ? (
						<div className={styles.emptyState}>
							<HistoricShield
								width={32}
								height={32}
								className={styles.emptyIcon}
							/>
							<p className={styles.emptyText}>
								{t("versionHistory.noHistory")}
							</p>
							<button
								type="button"
								className={styles.emptyAction}
								onClick={quickSave}
								disabled={isSaving}
							>
								{t("versionHistory.saveFirst")}
							</button>
						</div>
					) : (
						versions.map((version, index) => {
							const prevVersion = versions[index + 1];
							const charDiff = prevVersion
								? countWords(version.content_text) -
									countWords(prevVersion.content_text)
								: null;

							return (
								<VersionItem
									key={version.id}
									version={version}
									charDiff={charDiff}
									isExpanded={expandedVersionId === version.id}
									onToggleExpand={() => toggleExpanded(version.id)}
									onFullScreen={() => handlePreviewClick(version)}
									onRestore={() => handleRestoreClick(version.id)}
									onDelete={() => deleteVersion(version.id)}
									onUpdateLabel={(label) => updateLabel(version.id, label)}
									isRestoring={isRestoring}
									isDeleting={isDeleting}
									currentContent={currentContent}
									getDiffTexts={getDiffTexts}
									comparisonTarget={comparisonTarget}
									setComparisonTarget={setComparisonTarget}
									isPreviousDisabled={isPreviousDisabled(version.id)}
									isFirst={index === 0}
									isLast={index === versions.length - 1}
									isSingle={versions.length === 1}
								/>
							);
						})
					)}
				</div>

				<Dialog.Root value={previewDialog}>
					<Dialog.Frame open={previewDialog.open}>
						<Dialog.Content className={styles.diffDialog}>
							<div className={styles.diffDialogHeader}>
								<div className={styles.diffDialogTitleRow}>
									<h2 className={styles.diffDialogTitle}>
										{previewVersion?.label || t("versionHistory.diffTitle")}
									</h2>
									<button
										type="button"
										className={styles.diffDialogClose}
										onClick={handlePreviewClose}
										aria-label={t("common.close")}
									>
										&times;
									</button>
								</div>
								{previewVersion && (
									<div className={styles.diffDialogMeta}>
										<span className={styles.diffMetaItem}>
											<Clock width={14} height={14} />
											{formatDate(previewVersion.created_at)}
										</span>
										<span className={styles.diffMetaItem}>
											<Text width={14} height={14} />
											{countWords(previewVersion.content_text).toLocaleString()}
											{t("common.characters")}
										</span>
									</div>
								)}
							</div>
							<div className={styles.diffDialogBody}>
								<DiffView
									oldText={previewVersion?.content_text || ""}
									newText={currentContent}
									mode="side-by-side"
								/>
							</div>
							<div className={styles.diffDialogFooter}>
								<Button
									variant="secondary"
									size="sm"
									onClick={handlePreviewClose}
								>
									{t("versionHistory.close")}
								</Button>
								<Button
									size="sm"
									onClick={async () => {
										if (previewVersion) {
											const success = await handleRestoreClick(
												previewVersion.id,
											);
											if (success) {
												handlePreviewClose();
											}
										}
									}}
									disabled={isRestoring}
								>
									{t("versionHistory.restoreThis")}
								</Button>
							</div>
						</Dialog.Content>
					</Dialog.Frame>
				</Dialog.Root>
			</div>
		);
	},
);

type VersionItemProps = {
	version: SceneVersion;
	charDiff: number | null;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onFullScreen: () => void;
	onRestore: () => void;
	onDelete: () => void;
	onUpdateLabel: (label: string | null) => void;
	isRestoring: boolean;
	isDeleting: boolean;
	currentContent: string;
	getDiffTexts: (version: SceneVersion) => { oldText: string; newText: string };
	comparisonTarget: "current" | "previous";
	setComparisonTarget: (target: "current" | "previous") => void;
	isPreviousDisabled: boolean;
	isFirst: boolean;
	isLast: boolean;
	isSingle: boolean;
};

const VersionItem = ({
	version,
	charDiff,
	isExpanded,
	onToggleExpand,
	onFullScreen,
	onRestore,
	onDelete,
	onUpdateLabel,
	isRestoring,
	isDeleting,
	getDiffTexts,
	comparisonTarget,
	setComparisonTarget,
	isPreviousDisabled,
	isFirst,
	isLast,
	isSingle,
}: VersionItemProps) => {
	const { t } = useTranslation();
	const wordCount = useMemo(
		() => countWords(version.content_text),
		[version.content_text],
	);

	const [isEditingLabel, setIsEditingLabel] = useState(false);
	const [editLabelValue, setEditLabelValue] = useState("");
	const labelInputRef = useRef<HTMLInputElement>(null);

	const handleLabelClick = useCallback(() => {
		setEditLabelValue(version.label || "");
		setIsEditingLabel(true);
	}, [version.label]);

	useEffect(() => {
		if (isEditingLabel && labelInputRef.current) {
			labelInputRef.current.focus();
			labelInputRef.current.select();
		}
	}, [isEditingLabel]);

	const handleLabelConfirm = useCallback(() => {
		const trimmed = editLabelValue.trim();
		const newLabel = trimmed || null;
		if (newLabel !== version.label) {
			onUpdateLabel(newLabel);
		}
		setIsEditingLabel(false);
	}, [editLabelValue, version.label, onUpdateLabel]);

	const handleLabelCancel = useCallback(() => {
		setIsEditingLabel(false);
	}, []);

	const handleLabelKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleLabelConfirm();
			} else if (e.key === "Escape") {
				handleLabelCancel();
			}
		},
		[handleLabelConfirm, handleLabelCancel],
	);

	const diffTexts = useMemo(() => {
		if (!isExpanded) return null;
		return getDiffTexts(version);
	}, [isExpanded, getDiffTexts, version]);

	return (
		<div className={styles.timelineItem}>
			{!isSingle && (
				<div className={styles.timelineTrack}>
					<div
						className={`${styles.timelineLine} ${styles.lineTop} ${isFirst ? styles.lineFirst : ""}`}
					/>
					<div className={styles.timelineDot} />
					<div
						className={`${styles.timelineLine} ${isLast ? styles.lineLast : ""}`}
					/>
				</div>
			)}
			<div className={styles.versionItemContent}>
				<div className={styles.versionItem}>
					<div className={styles.versionHeader}>
						<div className={styles.versionLabel}>
							{isEditingLabel ? (
								<input
									ref={labelInputRef}
									type="text"
									className={styles.inlineLabelInput}
									value={editLabelValue}
									onChange={(e) => setEditLabelValue(e.target.value)}
									onKeyDown={handleLabelKeyDown}
									onBlur={handleLabelConfirm}
									placeholder={t("versionHistory.labelPlaceholder")}
								/>
							) : (
								<button
									type="button"
									className={styles.labelButton}
									onClick={handleLabelClick}
									title={t("versionHistory.editLabel")}
								>
									{version.label || t("versionHistory.noLabel")}
								</button>
							)}
						</div>
						<div className={styles.versionActions}>
							<Tooltip content={t("versionHistory.showDiff")}>
								<button
									type="button"
									className={styles.actionButton}
									onClick={onToggleExpand}
									aria-label={t("versionHistory.showDiff")}
								>
									<Eye width={12} height={12} />
								</button>
							</Tooltip>
							<Tooltip content={t("versionHistory.restoreTooltip")}>
								<button
									type="button"
									className={`${styles.actionButton} ${styles.restoreButton}`}
									onClick={onRestore}
									disabled={isRestoring}
									aria-label={t("versionHistory.restoreTooltip")}
								>
									<Undo width={12} height={12} />
								</button>
							</Tooltip>
							<Tooltip content={t("versionHistory.deleteTooltip")}>
								<button
									type="button"
									className={`${styles.actionButton} ${styles.deleteButton}`}
									onClick={onDelete}
									disabled={isDeleting}
									aria-label={t("versionHistory.deleteTooltip")}
								>
									<Trash width={12} height={12} />
								</button>
							</Tooltip>
						</div>
					</div>
					<div className={styles.versionMeta}>
						<span>{formatDate(version.created_at)}</span>
						<span>
							{" "}
							/ {wordCount.toLocaleString()}
							{t("common.characters")}
						</span>
						{charDiff !== null && (
							<span
								className={
									charDiff > 0
										? styles.diffPositive
										: charDiff < 0
											? styles.diffNegative
											: undefined
								}
							>
								{" "}
								{charDiff > 0 ? `+${charDiff}` : charDiff}
								{t("common.characters")}
							</span>
						)}
					</div>
				</div>
				{isExpanded && diffTexts && (
					<div className={styles.inlineDiff}>
						<div className={styles.inlineDiffActions}>
							<div className={styles.comparisonToggle}>
								<button
									type="button"
									className={`${styles.toggleButton} ${comparisonTarget === "current" ? styles.toggleActive : ""}`}
									onClick={() => setComparisonTarget("current")}
								>
									{t("versionHistory.diffWithCurrent")}
								</button>
								<button
									type="button"
									className={`${styles.toggleButton} ${comparisonTarget === "previous" ? styles.toggleActive : ""}`}
									onClick={() => setComparisonTarget("previous")}
									disabled={isPreviousDisabled}
								>
									{t("versionHistory.diffWithPrevious")}
								</button>
							</div>
							<Tooltip content={t("versionHistory.fullscreen")}>
								<button
									type="button"
									className={styles.actionButton}
									onClick={onFullScreen}
									aria-label={t("versionHistory.fullscreen")}
								>
									<Expand width={12} height={12} />
								</button>
							</Tooltip>
						</div>
						<div className={styles.inlineDiffBody}>
							<DiffView
								oldText={diffTexts.oldText}
								newText={diffTexts.newText}
								mode="unified"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
