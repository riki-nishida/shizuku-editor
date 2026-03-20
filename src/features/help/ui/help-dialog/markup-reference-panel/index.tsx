import { useTranslation } from "react-i18next";
import { getMarkupItems } from "./markup-data";
import styles from "./styles.module.css";

export const MarkupReferencePanel = () => {
	const { t } = useTranslation();
	const items = getMarkupItems(t);

	return (
		<div className={styles.root}>
			{items.map((item) => (
				<div key={item.name} className={styles.card}>
					<div className={styles.header}>
						<h3 className={styles.name}>{item.name}</h3>
						{item.auto && (
							<span className={styles.autoBadge}>{t("help.autoBadge")}</span>
						)}
					</div>
					<p className={styles.description}>{item.description}</p>
					<div className={styles.inputExample}>
						<span className={styles.inputLabel}>{t("help.inputLabel")}</span>
						<code className={styles.inputCode}>{item.input}</code>
					</div>
				</div>
			))}
		</div>
	);
};
