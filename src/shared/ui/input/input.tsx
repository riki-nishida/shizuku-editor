import { Field } from "@ark-ui/react/field";
import clsx from "clsx";
import type { ComponentProps } from "react";

import styles from "./styles.module.css";

type Props = Omit<ComponentProps<typeof Field.Input>, "size"> & {
	label?: string;
	inputSize?: "sm" | "md";
};

export const Input = ({
	className,
	label,
	id,
	inputSize = "md",
	ref,
	...props
}: Props) => {
	const inputClassName = clsx(
		styles.input,
		inputSize === "sm" && styles.inputSm,
		className,
	);

	return label ? (
		<Field.Root className={styles.root}>
			<Field.Label htmlFor={id} className={styles.label}>
				{label}
			</Field.Label>
			<Field.Input {...props} ref={ref} id={id} className={inputClassName} />
		</Field.Root>
	) : (
		<Field.Input {...props} ref={ref} id={id} className={inputClassName} />
	);
};
