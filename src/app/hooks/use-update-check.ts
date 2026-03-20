import { useToast } from "@shared/lib/toast";
import {
	appInitializedAtom,
	settingsDialogInitialTabAtom,
	settingsDialogOpenAtom,
} from "@shared/store/ui";
import { check } from "@tauri-apps/plugin-updater";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export const useUpdateCheck = () => {
	const { t } = useTranslation();
	const { showInfo } = useToast();
	const setSettingsOpen = useSetAtom(settingsDialogOpenAtom);
	const setInitialTab = useSetAtom(settingsDialogInitialTabAtom);
	const isInitialized = useAtomValue(appInitializedAtom);
	const hasChecked = useRef(false);

	const openUpdateSettings = useCallback(() => {
		setInitialTab("update");
		setSettingsOpen(true);
	}, [setInitialTab, setSettingsOpen]);

	useEffect(() => {
		if (!isInitialized) return;
		if (hasChecked.current) return;
		hasChecked.current = true;

		const checkForUpdates = async () => {
			try {
				const update = await check();

				if (update) {
					showInfo(t("updateCheck.newVersion", { version: update.version }), {
						label: t("updateCheck.openSettings"),
						onClick: openUpdateSettings,
					});
				}
			} catch {}
		};

		const timeoutId = setTimeout(checkForUpdates, 3000);

		return () => clearTimeout(timeoutId);
	}, [isInitialized, showInfo, openUpdateSettings, t]);
};
