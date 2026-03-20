import { Menu as ArkMenu, type MenuRootProps } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import clsx from "clsx";
import { Check } from "iconoir-react";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type MenuItemBase = {
	id: string | number;
	label: string;
	icon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	checked?: boolean;
	shortcut?: string;
	destructive?: boolean;
};

type MenuSeparator = {
	type: "separator";
	id: string | number;
};

export type MenuItem = MenuItemBase | MenuSeparator;

type Props = MenuRootProps & {
	trigger: ReactNode;
	items: MenuItem[];
};

export const Menu = ({ trigger, items, ...props }: Props) => {
	return (
		<ArkMenu.Root {...props}>
			<ArkMenu.Trigger asChild>{trigger}</ArkMenu.Trigger>
			<Portal>
				<ArkMenu.Positioner>
					<ArkMenu.Content className={styles.content}>
						{items.map((item) => {
							if ("type" in item && item.type === "separator") {
								return (
									<ArkMenu.Separator
										key={item.id}
										className={styles.separator}
									/>
								);
							}

							const menuItem = item as MenuItemBase;

							return (
								<ArkMenu.Item
									key={menuItem.id}
									value={menuItem.id.toString()}
									onClick={menuItem.onClick}
									disabled={menuItem.disabled}
									className={clsx(
										styles.item,
										menuItem.destructive && styles.destructive,
									)}
									data-disabled={menuItem.disabled}
								>
									{menuItem.icon && (
										<span className={styles.icon}>{menuItem.icon}</span>
									)}
									<span className={styles.label}>{menuItem.label}</span>
									<span className={styles.meta}>
										{menuItem.shortcut && (
											<span className={styles.shortcut}>
												{menuItem.shortcut}
											</span>
										)}
										{menuItem.checked !== undefined && (
											<span
												className={styles.checkIcon}
												data-visible={menuItem.checked}
											>
												{menuItem.checked && <Check width={16} height={16} />}
											</span>
										)}
									</span>
								</ArkMenu.Item>
							);
						})}
					</ArkMenu.Content>
				</ArkMenu.Positioner>
			</Portal>
		</ArkMenu.Root>
	);
};
