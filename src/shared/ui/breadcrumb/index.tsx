import { useIMESafeEnter } from "@shared/hooks/use-ime-safe-enter";
import { Tooltip } from "@shared/ui/tooltip";
import clsx from "clsx";
import { NavArrowRight } from "iconoir-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

export type BreadcrumbItem = {
	id: string;
	label: string;
	type: "work" | "chapter" | "scene";
	onClick?: () => void;
	onEdit?: (newLabel: string) => void;
};

type Props = {
	items: BreadcrumbItem[];
	className?: string;
};

export const Breadcrumb = ({ items, className }: Props) => {
	const { t } = useTranslation();

	if (items.length === 0) {
		return null;
	}

	return (
		<nav
			className={clsx(styles.breadcrumb, className)}
			aria-label={t("common.breadcrumb")}
		>
			{items.map((item, index) => (
				<BreadcrumbItemComponent
					key={item.id}
					item={item}
					isLast={index === items.length - 1}
				/>
			))}
		</nav>
	);
};

const BreadcrumbItemComponent = ({
	item,
	isLast,
}: {
	item: BreadcrumbItem;
	isLast: boolean;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(item.label);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setDraft(item.label);
	}, [item.label]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = useCallback(() => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== item.label) {
			item.onEdit?.(trimmed);
		} else {
			setDraft(item.label);
		}
		setIsEditing(false);
	}, [draft, item]);

	const handleCancel = useCallback(() => {
		setDraft(item.label);
		setIsEditing(false);
	}, [item.label]);

	const { handleKeyDown, handleCompositionStart, handleCompositionEnd } =
		useIMESafeEnter({
			onEnter: handleSave,
			onEscape: handleCancel,
		});

	const handleDoubleClick = useCallback(() => {
		if (item.onEdit) {
			setIsEditing(true);
		}
	}, [item.onEdit]);

	if (isEditing) {
		return (
			<>
				<input
					ref={inputRef}
					type="text"
					className={styles.editInput}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					onCompositionStart={handleCompositionStart}
					onCompositionEnd={handleCompositionEnd}
				/>
				{!isLast && (
					<span className={styles.separator}>
						<NavArrowRight width={14} height={14} />
					</span>
				)}
			</>
		);
	}

	const isEditable = !!item.onEdit;

	const itemElement = item.onClick ? (
		<button
			type="button"
			className={styles.item}
			onClick={item.onClick}
			onDoubleClick={isEditable ? handleDoubleClick : undefined}
			data-clickable
			data-editable={isEditable || undefined}
		>
			{item.label}
		</button>
	) : isEditable ? (
		<button
			type="button"
			className={styles.item}
			onDoubleClick={handleDoubleClick}
			data-current={isLast || undefined}
			data-editable
		>
			{item.label}
		</button>
	) : (
		<span className={styles.item} data-current={isLast || undefined}>
			{item.label}
		</span>
	);

	if (item.label.length > 16) {
		return (
			<>
				<Tooltip content={item.label}>{itemElement}</Tooltip>
				{!isLast && (
					<span className={styles.separator}>
						<NavArrowRight width={14} height={14} />
					</span>
				)}
			</>
		);
	}

	return (
		<>
			{itemElement}
			{!isLast && (
				<span className={styles.separator}>
					<NavArrowRight width={14} height={14} />
				</span>
			)}
		</>
	);
};
