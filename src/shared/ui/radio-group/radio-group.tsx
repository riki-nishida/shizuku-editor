import { RadioGroup as ArkRadioGroup } from "@ark-ui/react/radio-group";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

type RadioOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

type Props = Omit<
	ComponentPropsWithoutRef<typeof ArkRadioGroup.Root>,
	"value" | "onValueChange"
> & {
	value?: string;
	onValueChange?: (value: string) => void;
	options: RadioOption[];
	orientation?: "horizontal" | "vertical";
};

export const RadioGroup = ({
	value,
	onValueChange,
	options,
	orientation = "vertical",
	...props
}: Props) => {
	return (
		<ArkRadioGroup.Root
			className={styles.root}
			value={value}
			onValueChange={(details) => {
				if (details.value) {
					onValueChange?.(details.value);
				}
			}}
			orientation={orientation}
			{...props}
		>
			<div
				className={`${styles.group} ${orientation === "horizontal" ? styles.horizontal : styles.vertical}`}
			>
				{options.map((option) => (
					<ArkRadioGroup.Item
						key={option.value}
						value={option.value}
						className={styles.item}
						disabled={option.disabled}
					>
						<ArkRadioGroup.ItemControl className={styles.control}>
							<span className={styles.indicator} />
						</ArkRadioGroup.ItemControl>
						<ArkRadioGroup.ItemText className={styles.label}>
							{option.label}
						</ArkRadioGroup.ItemText>
						<ArkRadioGroup.ItemHiddenInput />
					</ArkRadioGroup.Item>
				))}
			</div>
		</ArkRadioGroup.Root>
	);
};
