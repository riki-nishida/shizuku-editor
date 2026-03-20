import { formatShortcut } from "@shared/lib/platform";
import { useTranslation } from "react-i18next";
import { getShortcutCategories } from "./shortcuts-data";
import styles from "./styles.module.css";

export const KeyboardShortcutsPanel = () => {
	const { t } = useTranslation();
	const categories = getShortcutCategories(t);

	return (
		<div className={styles.root}>
			{categories.map((category) => (
				<section key={category.title} className={styles.category}>
					<h3 className={styles.categoryTitle}>{category.title}</h3>
					<ul className={styles.list}>
						{category.items.map((item) => (
							<li key={item.keys} className={styles.item}>
								<span className={styles.label}>{item.label}</span>
								<kbd className={styles.kbd}>{formatShortcut(item.keys)}</kbd>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
};
