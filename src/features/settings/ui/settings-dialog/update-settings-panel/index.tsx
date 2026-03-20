import { Button } from "@shared/ui/button/button";
import { Progress } from "@shared/ui/progress/progress";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { Check, Download, WarningCircle } from "iconoir-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "../settings-section";
import styles from "./styles.module.css";

type UpdateStatus =
	| { type: "idle" }
	| { type: "checking" }
	| { type: "available"; version: string }
	| { type: "downloading"; progress: number }
	| { type: "ready" }
	| { type: "upToDate" }
	| { type: "error"; message: string };

export const UpdateSettingsPanel = () => {
	const { t } = useTranslation();
	const [status, setStatus] = useState<UpdateStatus>({ type: "idle" });
	const [currentVersion, setCurrentVersion] = useState<string>("");

	useEffect(() => {
		getVersion().then(setCurrentVersion);
	}, []);

	const checkForUpdates = useCallback(async () => {
		setStatus({ type: "checking" });

		try {
			const update = await check();

			if (update) {
				setStatus({ type: "available", version: update.version });
			} else {
				setStatus({ type: "upToDate" });
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: error instanceof Error ? error.message : t("error.unknown"),
			});
		}
	}, [t]);

	const downloadAndInstall = useCallback(async () => {
		setStatus({ type: "downloading", progress: 0 });

		try {
			const update = await check();

			if (!update) {
				setStatus({ type: "upToDate" });
				return;
			}

			let downloaded = 0;
			let contentLength = 0;

			await update.downloadAndInstall((event) => {
				switch (event.event) {
					case "Started":
						contentLength = event.data.contentLength ?? 0;
						break;
					case "Progress":
						downloaded += event.data.chunkLength;
						if (contentLength > 0) {
							setStatus({
								type: "downloading",
								progress: Math.round((downloaded / contentLength) * 100),
							});
						}
						break;
					case "Finished":
						break;
				}
			});

			setStatus({ type: "ready" });
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: t("settings.updatePanel.downloadFailed"),
			});
		}
	}, [t]);

	const handleRelaunch = useCallback(async () => {
		await relaunch();
	}, []);

	const cardStatus = (() => {
		switch (status.type) {
			case "available":
			case "downloading":
				return "warning";
			case "error":
				return "error";
			case "upToDate":
			case "ready":
				return "ok";
			default:
				return "neutral";
		}
	})();

	const cardTitle = (() => {
		switch (status.type) {
			case "available":
			case "downloading":
				return t("settings.updatePanel.newVersionAvailable");
			case "ready":
				return t("settings.updatePanel.updateReady");
			case "upToDate":
				return t("settings.updatePanel.latestVersion");
			case "error":
				return t("settings.updatePanel.checkFailed");
			case "checking":
				return t("settings.updatePanel.checking");
			default:
				return t("settings.updatePanel.versionInfo");
		}
	})();

	const cardMeta = (() => {
		if (status.type === "available") {
			return `v${currentVersion} → v${status.version}`;
		}
		if (status.type === "downloading") {
			return t("settings.updatePanel.downloading", {
				progress: status.progress,
			});
		}
		return `v${currentVersion || "..."}`;
	})();

	return (
		<div className={styles.container}>
			<div className={styles.statusCard} data-status={cardStatus}>
				<div className={styles.statusCardIcon}>
					{cardStatus === "ok" && <Check width={24} height={24} />}
					{cardStatus === "warning" && <Download width={24} height={24} />}
					{cardStatus === "error" && <WarningCircle width={24} height={24} />}
				</div>
				<div className={styles.statusCardContent}>
					<div className={styles.statusCardTitle}>{cardTitle}</div>
					<div className={styles.statusCardMeta}>{cardMeta}</div>
				</div>
				{status.type === "available" && (
					<Button variant="primary" size="sm" onClick={downloadAndInstall}>
						{t("settings.updatePanel.update")}
					</Button>
				)}
				{status.type === "ready" && (
					<Button variant="primary" size="sm" onClick={handleRelaunch}>
						{t("settings.updatePanel.restart")}
					</Button>
				)}
			</div>

			{status.type === "downloading" && (
				<div className={styles.progressArea}>
					<Progress value={status.progress} />
				</div>
			)}
			{status.type === "ready" && (
				<div className={styles.readyMessage}>
					{t("settings.updatePanel.readyMessage")}
				</div>
			)}
			{status.type === "error" && (
				<div className={styles.errorMessage}>
					<WarningCircle width={16} height={16} />
					<span>{status.message}</span>
				</div>
			)}

			{status.type !== "upToDate" && (
				<SettingsSection
					title={t("settings.updatePanel.checkForUpdates")}
					description={t("settings.updatePanel.checkDescription")}
				>
					<div className={styles.actions}>
						<Button
							variant="secondary"
							onClick={checkForUpdates}
							disabled={
								status.type === "checking" || status.type === "downloading"
							}
						>
							{t("settings.updatePanel.checkButton")}
						</Button>
					</div>
				</SettingsSection>
			)}
		</div>
	);
};
