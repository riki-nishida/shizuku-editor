import {
	Collapsible as ArkCollapsible,
	type CollapsibleContentProps,
	type CollapsibleIndicatorProps,
	type CollapsibleRootProps,
	type CollapsibleTriggerProps,
} from "@ark-ui/react/collapsible";
import clsx from "clsx";
import type { ComponentProps } from "react";
import styles from "./styles.module.css";

const Root = ({
	className,
	...props
}: CollapsibleRootProps & ComponentProps<"div">) => (
	<ArkCollapsible.Root className={clsx(styles.root, className)} {...props} />
);

const Trigger = ({
	className,
	...props
}: CollapsibleTriggerProps & ComponentProps<"button">) => (
	<ArkCollapsible.Trigger
		className={clsx(styles.trigger, className)}
		{...props}
	/>
);

const Content = ({
	className,
	...props
}: CollapsibleContentProps & ComponentProps<"div">) => (
	<ArkCollapsible.Content
		className={clsx(styles.content, className)}
		{...props}
	/>
);

const Indicator = ({
	className,
	...props
}: CollapsibleIndicatorProps & ComponentProps<"div">) => (
	<ArkCollapsible.Indicator
		className={clsx(styles.indicator, className)}
		{...props}
	/>
);

export const Collapsible = {
	Root,
	Trigger,
	Content,
	Indicator,
};
