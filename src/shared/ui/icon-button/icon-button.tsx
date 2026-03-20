import { Tooltip } from "@shared/ui/tooltip/tooltip";
import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";
import styles from "./styles.module.css";

type Variant = "ghost" | "outlined" | "primary";

type IconButtonProps = ComponentPropsWithRef<"button"> & {
	tooltip?: string;
	variant?: Variant;
	active?: boolean;
};

export const IconButton = ({
	tooltip,
	children,
	ref,
	className,
	variant = "ghost",
	active = false,
	...props
}: IconButtonProps) => {
	const button = (
		<button
			ref={ref}
			type="button"
			className={clsx(
				styles.iconButton,
				styles[variant],
				active && styles.active,
				className,
			)}
			aria-label={tooltip}
			{...props}
		>
			{children}
		</button>
	);

	if (tooltip) {
		return <Tooltip content={tooltip}>{button}</Tooltip>;
	}

	return button;
};
