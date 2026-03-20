import { platform } from "@tauri-apps/plugin-os";

export const isMacOS = (): boolean => {
	return platform() === "macos";
};

export const getModifierKey = (): string => {
	return isMacOS() ? "⌘" : "Ctrl";
};

export const formatShortcut = (keys: string): string => {
	const mod = getModifierKey();
	return keys
		.replace(/Mod/g, mod)
		.replace(/Shift/g, isMacOS() ? "⇧" : "Shift")
		.replace(/Alt/g, isMacOS() ? "⌥" : "Alt")
		.replace(/\+/g, isMacOS() ? " " : "+");
};
