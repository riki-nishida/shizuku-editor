import {
	type BackupInfo,
	createBackup,
	deleteBackup,
	listBackups,
	restartApp,
	restoreBackup,
} from "@features/settings/model";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { Button } from "@shared/ui/button/button";
import dayjs from "dayjs";
import type { TFunction } from "i18next";
import { Check, NavArrowDown, NavArrowUp, WarningCircle } from "iconoir-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AUTO_BACKUP_INTERVAL_HOURS = 24;

type BackupType = "auto" | "manual" | "pre_restore";

const getBackupType = (filename: string): BackupType => {
	if (filename.includes("pre_restore_")) return "pre_restore";
	if (filename.includes("auto_")) return "auto";
	return "manual";
};

const getBackupTypeLabel = (type: BackupType, t: TFunction): string => {
	switch (type) {
		case "auto":
			return t("settings.backupPanel.auto");
		case "manual":
			return t("settings.backupPanel.manual");
		case "pre_restore":
			return t("settings.backupPanel.preRestore");
	}
};

const parseBackupDate = (createdAt: string): dayjs.Dayjs => {
	return dayjs(createdAt.replace(" ", "T"));
};

const formatRelativeTime = (date: dayjs.Dayjs, t: TFunction): string => {
	const now = dayjs();
	const diffMinutes = now.diff(date, "minute");
	const diffHours = now.diff(date, "hour");
	const diffDays = now.diff(date, "day");

	if (diffMinutes < 1) return t("settings.backupPanel.justNow");
	if (diffMinutes < 60)
		return t("settings.backupPanel.minutesAgo", { count: diffMinutes });
	if (diffHours < 24)
		return t("settings.backupPanel.hoursAgo", { count: diffHours });
	if (diffDays < 7)
		return t("settings.backupPanel.daysAgo", { count: diffDays });
	if (diffDays < 30)
		return t("settings.backupPanel.weeksAgo", {
			count: Math.floor(diffDays / 7),
		});
	return date.format(t("settings.backupPanel.dateFormat"));
};

const formatNextBackupTime = (
	lastAutoBackupDate: dayjs.Dayjs | null,
	t: TFunction,
): string => {
	if (!lastAutoBackupDate) return t("settings.backupPanel.nextStartup");

	const nextBackupTime = lastAutoBackupDate.add(
		AUTO_BACKUP_INTERVAL_HOURS,
		"hour",
	);
	const now = dayjs();

	if (nextBackupTime.isBefore(now))
		return t("settings.backupPanel.nextStartup");

	const diffHours = nextBackupTime.diff(now, "hour");
	if (diffHours < 1) return t("settings.backupPanel.withinOneHour");
	if (diffHours < 24)
		return t("settings.backupPanel.hoursLater", { count: diffHours });
	return t("settings.backupPanel.daysLater", {
		count: Math.floor(diffHours / 24),
	});
};

const VISIBLE_BACKUPS_COUNT = 5;

export const BackupSettingsPanel = () => {
	const { t } = useTranslation();
	const [backups, setBackups] = useState<BackupInfo[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [restoringFilename, setRestoringFilename] = useState<string | null>(
		null,
	);
	const [showAll, setShowAll] = useState(false);
	const { showSuccess, showError } = useToast();

	const loadBackups = useCallback(async () => {
		const result = await listBackups();
		if (result.ok) {
			setBackups(result.value);
		}
	}, []);

	useEffect(() => {
		loadBackups();
	}, [loadBackups]);

	const { lastBackup, lastAutoBackup, status } = useMemo(() => {
		if (backups.length === 0) {
			return {
				lastBackup: null,
				lastAutoBackup: null,
				status: "warning" as const,
			};
		}

		const latest = backups[0];
		const latestDate = parseBackupDate(latest.created_at);
		const hoursSinceBackup = dayjs().diff(latestDate, "hour");

		const autoBackups = backups.filter(
			(b) => getBackupType(b.filename) === "auto",
		);
		const latestAuto =
			autoBackups.length > 0
				? parseBackupDate(autoBackups[0].created_at)
				: null;

		return {
			lastBackup: { info: latest, date: latestDate },
			lastAutoBackup: latestAuto,
			status: hoursSinceBackup < 24 ? ("ok" as const) : ("warning" as const),
		};
	}, [backups]);

	const visibleBackups = useMemo(() => {
		if (showAll) return backups;
		return backups.slice(0, VISIBLE_BACKUPS_COUNT);
	}, [backups, showAll]);

	const hiddenCount = backups.length - VISIBLE_BACKUPS_COUNT;

	const handleCreateBackup = async () => {
		setIsCreating(true);
		const result = await createBackup(false);
		if (result.ok) {
			showSuccess(t("settings.backupPanel.created"));
			await loadBackups();
		} else {
			showError(
				t("settings.backupPanel.createFailed", { error: result.error.message }),
			);
		}
		setIsCreating(false);
	};

	const handleRestore = async (backup: BackupInfo) => {
		const confirmed = await showConfirmDialog(
			t("settings.backupPanel.restoreConfirm"),
			{ kind: "warning" },
		);
		if (!confirmed) return;

		setRestoringFilename(backup.filename);
		const result = await restoreBackup(backup.filename);
		if (result.ok) {
			showSuccess(t("settings.backupPanel.restored"));
			setTimeout(() => {
				void restartApp();
			}, 1000);
		} else {
			showError(
				t("settings.backupPanel.restoreFailed", {
					error: result.error.message,
				}),
			);
			setRestoringFilename(null);
		}
	};

	const handleDelete = async (backup: BackupInfo) => {
		const confirmed = await showConfirmDialog(
			t("settings.backupPanel.deleteConfirm"),
			{ kind: "warning" },
		);
		if (!confirmed) return;

		const result = await deleteBackup(backup.filename);
		if (result.ok) {
			showSuccess(t("settings.backupPanel.deleted"));
			await loadBackups();
		} else {
			showError(
				t("settings.backupPanel.deleteFailed", { error: result.error.message }),
			);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.statusCard} data-status={status}>
				<div className={styles.statusIcon}>
					{status === "ok" ? (
						<Check width={24} height={24} />
					) : (
						<WarningCircle width={24} height={24} />
					)}
				</div>
				<div className={styles.statusContent}>
					<div className={styles.statusTitle}>
						{status === "ok"
							? t("settings.backupPanel.backedUp")
							: t("settings.backupPanel.backupRecommended")}
					</div>
					<div className={styles.statusMeta}>
						{lastBackup ? (
							<>
								{t("settings.backupPanel.lastBackup")}
								{formatRelativeTime(lastBackup.date, t)}（
								{getBackupTypeLabel(getBackupType(lastBackup.info.filename), t)}
								）<span className={styles.statusSeparator}>•</span>
								{t("settings.backupPanel.nextAuto")}
								{formatNextBackupTime(lastAutoBackup, t)}
							</>
						) : (
							t("settings.backupPanel.noBackups")
						)}
					</div>
				</div>
				<Button
					variant="primary"
					size="sm"
					onClick={handleCreateBackup}
					disabled={isCreating}
				>
					{t("common.save")}
				</Button>
			</div>

			{backups.length > 0 && (
				<div className={styles.listSection}>
					<div className={styles.listHeader}>
						{t("settings.backupPanel.history")}
					</div>
					<div className={styles.backupList}>
						{visibleBackups.map((backup) => {
							const type = getBackupType(backup.filename);
							const date = parseBackupDate(backup.created_at);
							const isRestoring = restoringFilename === backup.filename;

							return (
								<div key={backup.filename} className={styles.backupItem}>
									<div className={styles.backupInfo}>
										<span className={styles.backupBadge} data-type={type}>
											{getBackupTypeLabel(type, t)}
										</span>
										<span className={styles.backupTime}>
											{formatRelativeTime(date, t)}
										</span>
										<span className={styles.backupSize}>
											{formatFileSize(backup.size_bytes)}
										</span>
									</div>
									<div className={styles.backupActions}>
										<button
											type="button"
											className={styles.actionButton}
											onClick={() => handleRestore(backup)}
											disabled={isRestoring}
										>
											{isRestoring
												? t("settings.backupPanel.restoring")
												: t("common.restore")}
										</button>
										<button
											type="button"
											className={styles.deleteButton}
											onClick={() => handleDelete(backup)}
										>
											{t("common.delete")}
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{hiddenCount > 0 && (
						<button
							type="button"
							className={styles.toggleButton}
							onClick={() => setShowAll(!showAll)}
						>
							{showAll ? (
								<>
									<NavArrowUp width={16} height={16} />
									{t("settings.backupPanel.collapseOld")}
								</>
							) : (
								<>
									<NavArrowDown width={16} height={16} />
									{t("settings.backupPanel.showOldBackups", {
										count: hiddenCount,
									})}
								</>
							)}
						</button>
					)}
				</div>
			)}
		</div>
	);
};
