import { Switch as ArkSwitch } from "@ark-ui/react/switch";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

type Props = Omit<
	ComponentPropsWithoutRef<typeof ArkSwitch.Root>,
	"checked" | "onCheckedChange"
> & {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	label?: string;
};

export const Switch = ({
	checked,
	onCheckedChange,
	label,
	...props
}: Props) => {
	return (
		<ArkSwitch.Root
			className={styles.root}
			checked={checked}
			onCheckedChange={(details) => {
				onCheckedChange?.(details.checked);
			}}
			{...props}
		>
			<ArkSwitch.Control className={styles.control}>
				<ArkSwitch.Thumb className={styles.thumb} />
			</ArkSwitch.Control>
			{label && (
				<ArkSwitch.Label className={styles.label}>{label}</ArkSwitch.Label>
			)}
			<ArkSwitch.HiddenInput />
		</ArkSwitch.Root>
	);
};
