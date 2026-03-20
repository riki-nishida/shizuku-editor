import {
	Popover as ArkPopover,
	type PopoverRootProps,
} from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import { Tooltip } from "@shared/ui/tooltip/tooltip";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type Props = PopoverRootProps & {
	trigger: ReactNode;
	children: ReactNode;
	tooltip?: string;
};

export const Popover = ({ trigger, children, tooltip, ...props }: Props) => {
	return (
		<ArkPopover.Root {...props}>
			{tooltip ? (
				<Tooltip content={tooltip}>
					<span className={styles.triggerWrap}>
						<ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
					</span>
				</Tooltip>
			) : (
				<ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
			)}
			<Portal>
				<ArkPopover.Positioner>
					<ArkPopover.Content className={styles.content}>
						{children}
					</ArkPopover.Content>
				</ArkPopover.Positioner>
			</Portal>
		</ArkPopover.Root>
	);
};
