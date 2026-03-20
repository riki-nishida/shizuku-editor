import { createBackup, listBackups } from "@features/settings/model/backup";
import { useEffect, useRef } from "react";

const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const INITIAL_DELAY_MS = 5000;

export const useAutoBackup = () => {
	const hasInitialized = useRef(false);

	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		const checkAndRunBackup = async () => {
			try {
				const result = await listBackups();
				if (!result.ok) {
					console.error("[AutoBackup] Failed to list backups:", result.error);
					return;
				}

				const autoBackups = result.value.filter((b) =>
					b.filename.includes("auto_"),
				);

				const shouldBackup = (() => {
					if (autoBackups.length === 0) return true;

					const latestBackup = autoBackups[0];
					const lastBackupTime = new Date(
						latestBackup.created_at.replace(" ", "T"),
					).getTime();
					const now = Date.now();

					return now - lastBackupTime > AUTO_BACKUP_INTERVAL_MS;
				})();

				if (shouldBackup) {
					const backupResult = await createBackup(true);
					if (!backupResult.ok) {
						console.error(
							"[AutoBackup] Failed to create backup:",
							backupResult.error,
						);
					}
				}
			} catch (error) {
				console.error("[AutoBackup] Unexpected error:", error);
			}
		};

		const initialTimeoutId = setTimeout(checkAndRunBackup, INITIAL_DELAY_MS);

		const intervalId = setInterval(checkAndRunBackup, CHECK_INTERVAL_MS);

		return () => {
			clearTimeout(initialTimeoutId);
			clearInterval(intervalId);
		};
	}, []);
};
