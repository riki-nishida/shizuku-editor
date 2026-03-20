import { pendingSavesRegistry } from "@shared/hooks/pending-saves-registry";
import { useToast } from "@shared/lib/toast";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const appWindow = getCurrentWindow();

const CLOSE_DELAY_MS = 800;

export const useCloseHandler = () => {
	const { t } = useTranslation();
	const { showSuccess } = useToast();

	useEffect(() => {
		const unlisten = appWindow.onCloseRequested(async (event) => {
			event.preventDefault();

			const saved = await pendingSavesRegistry.flushAll();

			if (saved) {
				showSuccess(t("common.saved"));
				await new Promise((resolve) => setTimeout(resolve, CLOSE_DELAY_MS));
			}

			await appWindow.destroy();
		});

		return () => {
			void unlisten.then((fn) => fn());
		};
	}, [showSuccess, t]);
};
