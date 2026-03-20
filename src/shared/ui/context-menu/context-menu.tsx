import { Menu, type MenuRootProps } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import clsx from "clsx";
import { Check, NavArrowRight } from "iconoir-react";
import type { ReactNode } from "react";
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

type Props = MenuRootProps & {
	items: ContextMenuItem[];
};

const createRenderItem =
	(onSelect?: (details: { value: string }) => void) =>
	(item: ContextMenuItem) => {
		if (item.separator) {
			return (
				<Menu.Separator
					key={item.value}
					className={styles["context-menu-separator"]}
				/>
			);
		}

		if (item.customContent) {
			return (
				<Menu.Root
					key={item.value}
					positioning={{ placement: "right-start", gutter: -4 }}
					onSelect={onSelect}
				>
					<Menu.TriggerItem className={styles["context-menu-item"]}>
						{item.icon && (
							<span className={styles["context-menu-icon"]}>{item.icon}</span>
						)}
						{item.label}
						<span className={styles["context-menu-arrow"]}>
							<NavArrowRight width={14} height={14} />
						</span>
					</Menu.TriggerItem>
					<Menu.Positioner>
						<Menu.Content
							className={clsx(
								styles["context-menu"],
								item.customContentClassName,
							)}
						>
							{item.customContent}
						</Menu.Content>
					</Menu.Positioner>
				</Menu.Root>
			);
		}

		if (item.children && item.children.length > 0) {
			return (
				<Menu.Root
					key={item.value}
					positioning={{ placement: "right-start", gutter: -4 }}
					onSelect={onSelect}
				>
					<Menu.TriggerItem className={styles["context-menu-item"]}>
						{item.icon && (
							<span className={styles["context-menu-icon"]}>{item.icon}</span>
						)}
						{item.label}
						<span className={styles["context-menu-arrow"]}>
							<NavArrowRight width={14} height={14} />
						</span>
					</Menu.TriggerItem>
					<Menu.Positioner>
						<Menu.Content className={styles["context-menu"]}>
							{item.children.map(createRenderItem(onSelect))}
						</Menu.Content>
					</Menu.Positioner>
				</Menu.Root>
			);
		}

		return (
			<Menu.Item
				key={item.value}
				value={item.value}
				className={clsx(
					styles["context-menu-item"],
					item.destructive && styles["context-menu-item-destructive"],
				)}
			>
				{item.colorIndicator && (
					<span
						className={styles["context-menu-color"]}
						style={{ backgroundColor: item.colorIndicator }}
					/>
				)}
				{item.icon && (
					<span className={styles["context-menu-icon"]}>{item.icon}</span>
				)}
				{item.label}
				{item.checked && (
					<span className={styles["context-menu-check"]}>
						<Check width={14} height={14} />
					</span>
				)}
			</Menu.Item>
		);
	};

export const ContextMenu = ({ children, items, ...props }: Props) => {
	const renderItem = createRenderItem(props.onSelect);
	return (
		<Menu.Root {...props}>
			<Menu.ContextTrigger className={styles["context-trigger"]}>
				{children}
			</Menu.ContextTrigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content className={styles["context-menu"]}>
						{items.map(renderItem)}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};
