import { formatDate } from "@shared/lib/date";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type MetaPanelProps = {
	createdAt: string;
	updatedAt: string;
};

export const MetaPanel = ({ createdAt, updatedAt }: MetaPanelProps) => {
	const { t } = useTranslation();
	const formattedCreatedAt = useMemo(
		() => (createdAt ? formatDate(createdAt) : null),
		[createdAt],
	);
	const formattedUpdatedAt = useMemo(
		() => (updatedAt ? formatDate(updatedAt) : null),
		[updatedAt],
	);

	return (
		<div className={styles.panel}>
			<div className={styles.metaRow}>
				{formattedCreatedAt && (
					<div className={styles.metaItem}>
						<div className={styles.metaLabel}>{t("common.createdAt")}</div>
						<div className={styles.metaValue}>{formattedCreatedAt}</div>
					</div>
				)}
				{formattedUpdatedAt && (
					<div className={styles.metaItem}>
						<div className={styles.metaLabel}>{t("common.updatedAt")}</div>
						<div className={styles.metaValue}>{formattedUpdatedAt}</div>
					</div>
				)}
			</div>
		</div>
	);
};
