import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

const appWindow = getCurrentWindow();

export const useFullscreen = () => {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const checkFullscreen = async () => {
			const fullscreen = await appWindow.isFullscreen();
			setIsFullscreen(fullscreen);
		};

		void checkFullscreen();

		const unlisten = appWindow.onResized(async () => {
			const fullscreen = await appWindow.isFullscreen();
			setIsFullscreen(fullscreen);
		});

		return () => {
			void unlisten.then((fn) => fn());
		};
	}, []);

	return isFullscreen;
};
