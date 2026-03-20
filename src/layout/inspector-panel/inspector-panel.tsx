import { Inspector } from "@features/inspector";
import { isMacOS } from "@shared/lib";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

export const InspectorPanel = () => {
	const { t } = useTranslation();
	return (
		<aside className={styles.container} aria-label={t("common.inspectorPanel")}>
			{isMacOS() && (
				<div className={styles.dragRegion} data-tauri-drag-region />
			)}
			<Inspector />
		</aside>
	);
};
