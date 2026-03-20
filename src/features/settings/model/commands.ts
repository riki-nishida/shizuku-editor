import { invokeCommand } from "@shared/lib/commands";
import type { Settings } from "./types";

export const getSettings = () => {
	return invokeCommand<Settings>("get_settings");
};

export const saveSettings = (settings: Settings) => {
	return invokeCommand<Settings>("save_settings", { settings });
};

export const listSystemFonts = () => {
	return invokeCommand<string[]>("list_system_fonts");
};
