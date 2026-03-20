import i18n from "@shared/lib/i18n";
import { ask } from "@tauri-apps/plugin-dialog";

type ConfirmOptions = {
	title?: string;
	kind?: "info" | "warning" | "error";
	okLabel?: string;
	cancelLabel?: string;
};

export const showConfirmDialog = async (
	messageText: string,
	options?: ConfirmOptions,
): Promise<boolean> => {
	return ask(messageText, {
		title: options?.title,
		kind: options?.kind,
		okLabel: options?.okLabel ?? i18n.t("common.yes"),
		cancelLabel: options?.cancelLabel ?? i18n.t("common.cancel"),
	});
};
