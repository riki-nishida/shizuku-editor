import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

import styles from "./styles.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	size?: Size;
};

export const Button = ({
	className,
	variant = "primary",
	size = "md",
	disabled,
	children,
	...props
}: Props) => (
	<button
		{...props}
		disabled={disabled}
		className={clsx(
			styles.button,
			styles[variant],
			styles[size],
			disabled && styles.disabled,
			className,
		)}
	>
		{children}
	</button>
);
