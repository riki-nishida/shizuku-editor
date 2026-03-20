import { Checkbox as ArkCheckbox } from "@ark-ui/react/checkbox";
import { Check, Minus } from "iconoir-react";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

type CheckedState = boolean | "indeterminate";

type Props = Omit<
	ComponentPropsWithoutRef<typeof ArkCheckbox.Root>,
	"checked" | "onCheckedChange"
> & {
	checked?: CheckedState;
	onCheckedChange?: (checked: CheckedState) => void;
	label?: string;
	size?: "xs" | "sm" | "md";
};

const ICON_SIZES: Record<string, number> = { xs: 8, sm: 10, md: 14 };

export const Checkbox = ({
	checked,
	onCheckedChange,
	label,
	size = "md",
	...props
}: Props) => {
	const iconSize = ICON_SIZES[size];

	return (
		<ArkCheckbox.Root
			className={`${styles.root} ${size === "xs" ? styles.rootXs : size === "sm" ? styles.rootSm : ""}`}
			checked={checked}
			onCheckedChange={(details) => {
				onCheckedChange?.(details.checked);
			}}
			{...props}
		>
			<ArkCheckbox.Control className={styles.control}>
				<ArkCheckbox.Indicator className={styles.indicator}>
					{checked === "indeterminate" ? (
						<Minus width={iconSize} height={iconSize} strokeWidth={2.5} />
					) : (
						<Check width={iconSize} height={iconSize} strokeWidth={2.5} />
					)}
				</ArkCheckbox.Indicator>
			</ArkCheckbox.Control>
			{label && (
				<ArkCheckbox.Label className={styles.label}>{label}</ArkCheckbox.Label>
			)}
			<ArkCheckbox.HiddenInput />
		</ArkCheckbox.Root>
	);
};
