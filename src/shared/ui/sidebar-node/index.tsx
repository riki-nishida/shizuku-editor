import { useSortableItem } from "@shared/lib/dnd";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ContextMenu } from "../context-menu/context-menu";
import styles from "./styles.module.css";

type ContextMenuItem = {
	value: string;
	label: string;
	icon?: ReactNode;
	separator?: boolean;
	destructive?: boolean;
	colorIndicator?: string;
	checked?: boolean;
	children?: ContextMenuItem[];
	customContent?: ReactNode;
	customContentClassName?: string;
};

type SidebarNodeProps = {
	icon?: ReactNode;
	title: ReactNode;
	isActive: boolean;
	onClick: () => void;
	contextMenuItems?: ContextMenuItem[];
	onContextMenuSelect?: (details: { value: string }) => void;
	editingContent?: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	variant?: "leaf" | "branch";
	className?: string;
};

export const SidebarNode = ({
	icon,
	title,
	isActive,
	onClick,
	contextMenuItems,
	onContextMenuSelect,
	editingContent,
	subtitle,
	action,
	variant = "leaf",
	className,
}: SidebarNodeProps) => {
	const titleClass =
		variant === "leaf" ? clsx(styles.title, styles.leafTitle) : styles.title;

	const content = editingContent ? (
		<div className={styles.editSlot}>{editingContent}</div>
	) : subtitle ? (
		<div className={styles.subtitleGroup}>
			<span className={titleClass}>{title}</span>
			{subtitle}
		</div>
	) : (
		<span className={titleClass}>{title}</span>
	);

	const iconEl = icon ? <span className={styles.icon}>{icon}</span> : null;

	const hasContextMenu = contextMenuItems && contextMenuItems.length > 0;
	const wrap = (node: ReactNode) =>
		hasContextMenu && onContextMenuSelect ? (
			<ContextMenu items={contextMenuItems} onSelect={onContextMenuSelect}>
				{node}
			</ContextMenu>
		) : (
			node
		);

	if (variant === "leaf") {
		return wrap(
			<button
				type="button"
				className={clsx(
					styles.root,
					styles.button,
					isActive && styles.active,
					className,
				)}
				onClick={onClick}
			>
				{iconEl}
				{content}
				{action}
			</button>,
		);
	}

	return wrap(
		<div className={clsx(styles.root, isActive && styles.active, className)}>
			{iconEl}
			<button type="button" className={styles.labelButton} onClick={onClick}>
				{content}
			</button>
			{action}
		</div>,
	);
};

type SortableNodeWrapperProps = {
	sortableId: string;
	disableIndicator?: boolean;
	children: ReactNode;
};

export const NodeDragOverlay = ({ title }: { title: string }) => {
	return <div className={styles.dragOverlay}>{title}</div>;
};

export const SortableNodeWrapper = ({
	sortableId,
	disableIndicator = false,
	children,
}: SortableNodeWrapperProps) => {
	const { setNodeRef, style, isBefore, showIndicator, attributes, listeners } =
		useSortableItem({ id: sortableId });

	const show = showIndicator && !disableIndicator;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={clsx(
				styles.sortableWrapper,
				show && isBefore && styles.indicatorBefore,
				show && !isBefore && styles.indicatorAfter,
			)}
			{...attributes}
			{...listeners}
		>
			{children}
		</div>
	);
};
