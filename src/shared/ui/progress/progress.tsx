import { Progress as ArkProgress } from "@ark-ui/react/progress";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

type Props = ComponentPropsWithoutRef<typeof ArkProgress.Root> & {
	value: number;
	max?: number;
	min?: number;
};

export const Progress = ({ value, max = 100, min = 0, ...props }: Props) => {
	return (
		<ArkProgress.Root
			className={styles.root}
			value={value}
			max={max}
			min={min}
			{...props}
		>
			<ArkProgress.Track className={styles.track}>
				<ArkProgress.Range className={styles.range} />
			</ArkProgress.Track>
		</ArkProgress.Root>
	);
};
