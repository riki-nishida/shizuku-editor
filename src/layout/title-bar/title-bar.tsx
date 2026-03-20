import { useAtomValue } from "jotai";
import { themeSettingsAtom } from "@/features/settings";
import { useWindowControls } from "@/features/window-controls";
import { ShizukuIcon } from "@/shared/ui/shizuku-icon";
import { MenuBar, useAppMenu } from "./menu-bar";
import styles from "./styles.module.css";

export const TitleBar = () => {
	const { isMac } = useWindowControls();
	const menus = useAppMenu();
	const { theme } = useAtomValue(themeSettingsAtom);

	if (isMac) {
		return null;
	}

	return (
		<nav className={styles.titleBar}>
			<span className={styles.appIcon}>
				<ShizukuIcon size={18} variant={theme} />
			</span>
			<div className={styles.menuBarWrapper}>
				<MenuBar menus={menus} />
			</div>
			<div className={styles.spacer} data-tauri-drag-region />
		</nav>
	);
};
