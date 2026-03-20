import { Portal } from "@ark-ui/react/portal";
import {
	Select as ArkSelect,
	createListCollection,
	type SelectRootProps,
} from "@ark-ui/react/select";
import { Check, NavArrowDown } from "iconoir-react";
import styles from "./styles.module.css";

type SelectItem = {
	label: string;
	value: string;
	disabled: boolean;
};

type Props = Omit<SelectRootProps<SelectItem>, "collection" | "value"> & {
	items: string[];
	placeholder?: string;
	value?: string | null;
	size?: "sm" | "md";
	fullWidth?: boolean;
	label?: string;
	variant?: "ghost" | "outline";
	disabledItems?: string[];
};

export const Select = ({
	items,
	placeholder,
	value,
	size = "md",
	fullWidth = false,
	label,
	variant = "ghost",
	disabledItems = [],
	...props
}: Props) => {
	const collection = createListCollection({
		items: items.map((item) => ({
			label: item,
			value: item,
			disabled: disabledItems.includes(item),
		})),
	});
	const selectedValue = value ? [value] : undefined;

	return (
		<ArkSelect.Root
			className={`${styles.root} ${fullWidth ? styles.fullWidth : ""}`}
			collection={collection}
			value={selectedValue}
			{...props}
		>
			{label && (
				<ArkSelect.Label className={styles.label}>{label}</ArkSelect.Label>
			)}
			<ArkSelect.Control
				className={`${styles.control} ${fullWidth ? styles.fullWidth : ""}`}
			>
				<ArkSelect.Trigger
					className={`${styles.trigger} ${styles[variant]} ${size === "sm" ? styles.triggerSm : ""} ${fullWidth ? styles.fullWidth : ""}`}
				>
					<ArkSelect.ValueText placeholder={placeholder} />
					<ArkSelect.Indicator className={styles.indicator}>
						<NavArrowDown width={16} height={16} strokeWidth={2} />
					</ArkSelect.Indicator>
				</ArkSelect.Trigger>
			</ArkSelect.Control>
			<Portal>
				<ArkSelect.Positioner>
					<ArkSelect.Content className={styles.content}>
						<ArkSelect.ItemGroup>
							{collection.items.map((item) => (
								<ArkSelect.Item
									key={item.value}
									item={item}
									className={styles.item}
								>
									<ArkSelect.ItemText className={styles.itemText}>
										{item.label}
									</ArkSelect.ItemText>
									<span className={styles.checkIcon}>
										<Check width={16} height={16} />
									</span>
								</ArkSelect.Item>
							))}
						</ArkSelect.ItemGroup>
					</ArkSelect.Content>
				</ArkSelect.Positioner>
			</Portal>
			<ArkSelect.HiddenSelect />
		</ArkSelect.Root>
	);
};
