import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback } from "react";

const appWindow = getCurrentWindow();
const isMacOS = platform() === "macos";

export const useWindowControls = () => {
	const minimize = useCallback(() => {
		void appWindow.minimize();
	}, []);

	const toggleMaximize = useCallback(async () => {
		if (isMacOS) {
			const isFullscreen = await appWindow.isFullscreen();
			await appWindow.setFullscreen(!isFullscreen);
		} else {
			void appWindow.toggleMaximize();
		}
	}, []);

	const close = useCallback(() => {
		void appWindow.close();
	}, []);

	return {
		isMac: isMacOS,
		minimize,
		toggleMaximize,
		close,
	};
};
