import { Menu as ArkMenu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { Check, NavArrowRight } from "iconoir-react";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type MenuItemBase = {
	id: string;
	label: string;
	icon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	checked?: boolean;
	shortcut?: string;
};

type MenuSeparator = {
	type: "separator";
	id: string;
};

type SubMenuItem = {
	type: "submenu";
	id: string;
	label: string;
	items: MenuBarItem[];
};

export type MenuBarItem = MenuItemBase | MenuSeparator | SubMenuItem;

type MenuBarMenu = {
	id: string;
	label: string;
	items: MenuBarItem[];
};

type Props = {
	menus: MenuBarMenu[];
};

const renderMenuItems = (items: MenuBarItem[]) => {
	return items.map((item) => {
		if ("type" in item && item.type === "separator") {
			return <ArkMenu.Separator key={item.id} className={styles.separator} />;
		}

		if ("type" in item && item.type === "submenu") {
			return (
				<ArkMenu.Root
					key={item.id}
					positioning={{ placement: "right-start", gutter: 0 }}
				>
					<ArkMenu.TriggerItem className={styles.item}>
						<span className={styles.label}>{item.label}</span>
						<span className={styles.submenuArrow}>
							<NavArrowRight width={14} height={14} />
						</span>
					</ArkMenu.TriggerItem>
					<Portal>
						<ArkMenu.Positioner>
							<ArkMenu.Content className={styles.submenuContent}>
								{renderMenuItems(item.items)}
							</ArkMenu.Content>
						</ArkMenu.Positioner>
					</Portal>
				</ArkMenu.Root>
			);
		}

		const menuItem = item as MenuItemBase;

		return (
			<ArkMenu.Item
				key={menuItem.id}
				value={menuItem.id}
				onClick={menuItem.onClick}
				disabled={menuItem.disabled}
				className={styles.item}
				data-disabled={menuItem.disabled}
			>
				{menuItem.icon && <span className={styles.icon}>{menuItem.icon}</span>}
				<span className={styles.label}>{menuItem.label}</span>
				<span className={styles.meta}>
					{menuItem.shortcut && (
						<span className={styles.shortcut}>{menuItem.shortcut}</span>
					)}
					{menuItem.checked !== undefined && (
						<span className={styles.checkIcon} data-visible={menuItem.checked}>
							{menuItem.checked && <Check width={16} height={16} />}
						</span>
					)}
				</span>
			</ArkMenu.Item>
		);
	});
};

export const MenuBar = ({ menus }: Props) => {
	return (
		<div className={styles.menuBar}>
			{menus.map((menu) => (
				<ArkMenu.Root
					key={menu.id}
					positioning={{ placement: "bottom-start", gutter: 4 }}
				>
					<ArkMenu.Trigger
						className={styles.menuTrigger}
						onDoubleClick={(e) => e.stopPropagation()}
					>
						{menu.label}
					</ArkMenu.Trigger>
					<Portal>
						<ArkMenu.Positioner>
							<ArkMenu.Content className={styles.content}>
								{renderMenuItems(menu.items)}
							</ArkMenu.Content>
						</ArkMenu.Positioner>
					</Portal>
				</ArkMenu.Root>
			))}
		</div>
	);
};
