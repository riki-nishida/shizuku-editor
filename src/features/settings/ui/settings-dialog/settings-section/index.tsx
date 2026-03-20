import type { ReactNode } from "react";
import styles from "./styles.module.css";

type Props = {
	title: string;
	description?: string;
	children: ReactNode;
};

export const SettingsSection = ({ title, description, children }: Props) => {
	return (
		<section className={styles.section}>
			<div className={styles.header}>
				<h3 className={styles.title}>{title}</h3>
				{description && <p className={styles.description}>{description}</p>}
			</div>
			<div className={styles.content}>{children}</div>
		</section>
	);
};
