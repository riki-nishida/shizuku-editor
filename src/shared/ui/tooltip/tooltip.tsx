import { Portal } from "@ark-ui/react/portal";
import {
	Tooltip as ArkTooltip,
	type TooltipRootProps,
} from "@ark-ui/react/tooltip";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type Props = Omit<TooltipRootProps, "children"> & {
	children: ReactNode;
	content: ReactNode;
	showArrow?: boolean;
};

export const Tooltip = ({
	children,
	content,
	showArrow = true,
	openDelay = 300,
	closeDelay = 100,
	...props
}: Props) => {
	return (
		<ArkTooltip.Root openDelay={openDelay} closeDelay={closeDelay} {...props}>
			<ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
			<Portal>
				<ArkTooltip.Positioner>
					<ArkTooltip.Content className={styles.content}>
						{showArrow && (
							<ArkTooltip.Arrow className={styles.arrow}>
								<ArkTooltip.ArrowTip className={styles.arrowTip} />
							</ArkTooltip.Arrow>
						)}
						{content}
					</ArkTooltip.Content>
				</ArkTooltip.Positioner>
			</Portal>
		</ArkTooltip.Root>
	);
};
