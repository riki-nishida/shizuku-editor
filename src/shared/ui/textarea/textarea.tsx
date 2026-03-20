import { Field } from "@ark-ui/react/field";
import clsx from "clsx";
import type { ComponentProps } from "react";

import styles from "./styles.module.css";

type Props = ComponentProps<typeof Field.Textarea> & {
	label?: string;
};

export const Textarea = ({ className, label, id, ...props }: Props) => (
	<Field.Root className={styles.root}>
		{label && (
			<Field.Label htmlFor={id} className={styles.label}>
				{label}
			</Field.Label>
		)}
		<Field.Textarea
			{...props}
			id={id}
			className={clsx(styles.textarea, className)}
		/>
	</Field.Root>
);
