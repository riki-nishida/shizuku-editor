import { IconButton } from "@shared/ui/icon-button";
import clsx from "clsx";
import { NavArrowDown, Page, Redo, XmarkCircle } from "iconoir-react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";
import { useTrashNodeActions } from "./use-trash-node-actions";

type NodeType = "chapter" | "scene";

export type TrashNodeProps = {
	id: string;
	title: string;
	type: NodeType;
	isCollapsed?: boolean;
	onToggle?: () => void;

	hideRestore?: boolean;
};

export const TrashNode = ({
	id,
	title,
	type,
	isCollapsed = false,
	onToggle,
	hideRestore = false,
}: TrashNodeProps) => {
	const { t } = useTranslation();
	const { handleRestore, handlePermanentDelete } = useTrashNodeActions({
		id,
		type,
		title,
	});

	if (type === "chapter") {
		return (
			<div className={styles.root}>
				<button
					type="button"
					className={clsx(styles.iconButton, isCollapsed && styles.collapsed)}
					aria-label={
						isCollapsed
							? t("common.expandChapter")
							: t("common.collapseChapter")
					}
					aria-expanded={!isCollapsed}
					onClick={onToggle}
					data-collapsed={isCollapsed}
				>
					<NavArrowDown aria-hidden="true" />
				</button>
				<span className={styles.title}>{title}</span>
				<div className={styles.actions}>
					{!hideRestore && (
						<IconButton
							tooltip={t("outline.restoreTooltip")}
							className={styles.actionButton}
							onClick={handleRestore}
						>
							<Redo />
						</IconButton>
					)}
					<IconButton
						tooltip={t("outline.permanentDelete")}
						className={clsx(
							styles.actionButton,
							styles.actionButtonDestructive,
						)}
						onClick={handlePermanentDelete}
					>
						<XmarkCircle />
					</IconButton>
				</div>
			</div>
		);
	}

	return (
		<div className={clsx(styles.root, styles.scene)}>
			<span className={styles.icon} aria-hidden="true">
				<Page />
			</span>
			<span className={styles.title}>{title}</span>
			<div className={styles.actions}>
				{!hideRestore && (
					<IconButton
						tooltip={t("outline.restoreTooltip")}
						className={styles.actionButton}
						onClick={handleRestore}
					>
						<Redo />
					</IconButton>
				)}
				<IconButton
					tooltip={t("outline.permanentDelete")}
					className={clsx(styles.actionButton, styles.actionButtonDestructive)}
					onClick={handlePermanentDelete}
				>
					<XmarkCircle />
				</IconButton>
			</div>
		</div>
	);
};
