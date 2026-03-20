import { isMacOS } from "@shared/lib/platform";
import { useTranslation } from "react-i18next";

import styles from "./styles.module.css";

type Props = {
	isVertical: boolean;
};

export const VerticalPreviewBanner = ({ isVertical }: Props) => {
	const { t } = useTranslation();
	if (!isVertical || !isMacOS()) return null;

	return (
		<div className={styles.previewBanner}>
			<span className={styles.previewBadge}>
				{t("write.verticalPreview.badge")}
			</span>
			<span>{t("write.verticalPreview.message")}</span>
		</div>
	);
};
