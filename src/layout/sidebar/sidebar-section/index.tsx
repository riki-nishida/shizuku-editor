import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type SidebarSectionProps = {
	title: string;
	icon?: ReactNode;
	isOpen: boolean;
	onToggle: () => void;
	actions?: ReactNode;
	children: ReactNode;
	inSplitter?: boolean;
};

export const SidebarSection = ({
	title,
	icon,
	isOpen,
	onToggle,
	actions,
	children,
	inSplitter = false,
}: SidebarSectionProps) => {
	return (
		<section
			className={clsx(
				styles.section,
				isOpen && styles.open,
				inSplitter && styles.inSplitter,
			)}
		>
			<header className={styles.header}>
				<button
					type="button"
					className={styles.headerButton}
					onClick={onToggle}
					aria-expanded={isOpen}
				>
					{icon && <span className={styles.icon}>{icon}</span>}
					<span className={styles.title}>{title}</span>
				</button>
				{actions && <div className={styles.actions}>{actions}</div>}
			</header>
			{isOpen && <div className={styles.content}>{children}</div>}
		</section>
	);
};
