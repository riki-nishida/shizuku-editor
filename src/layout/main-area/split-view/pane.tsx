import type { ActivePane, PaneContent } from "@shared/store/split-view";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PaneContentRenderer } from "./pane-content";
import styles from "./styles.module.css";

type Props = {
	paneId: ActivePane;
	content: PaneContent;
	isActive: boolean;
	onActivate: () => void;
};

export const Pane = ({ paneId, content, isActive, onActivate }: Props) => {
	const { t } = useTranslation();
	const handleClick = useCallback(() => {
		if (!isActive) {
			onActivate();
		}
	}, [isActive, onActivate]);

	const paneClassName = [styles.pane, !isActive && styles.paneInactive]
		.filter(Boolean)
		.join(" ");

	return (
		<section
			className={paneClassName}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleClick();
				}
			}}
			aria-label={
				paneId === "primary" ? t("common.mainPane") : t("common.subPane")
			}
		>
			<div className={styles.paneContent}>
				<PaneContentRenderer
					content={content}
					paneId={paneId}
					isActive={isActive}
				/>
			</div>
		</section>
	);
};
