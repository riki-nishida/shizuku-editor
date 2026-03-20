import clsx from "clsx";
import { Search, Xmark } from "iconoir-react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../input/input";
import styles from "./styles.module.css";

type Props = Omit<ComponentProps<typeof Input>, "label" | "type"> & {
	suffix?: ReactNode;
	onClear?: () => void;
	ref?: Ref<HTMLInputElement>;
};

export const SearchInput = ({
	className,
	value,
	suffix,
	onClear,
	ref,
	...props
}: Props) => {
	const { t } = useTranslation();
	const hasValue = Boolean(value);

	const handleClear = () => {
		onClear?.();
	};

	return (
		<div className={clsx(styles.container, className)}>
			<Search width={16} height={16} className={styles.icon} />
			<Input
				ref={ref}
				type="text"
				value={value}
				className={styles.input}
				{...props}
			/>
			{hasValue && (
				<>
					{suffix && <span className={styles.suffix}>{suffix}</span>}
					<button
						type="button"
						className={styles.clearButton}
						onClick={handleClear}
						title={t("common.clear")}
					>
						<Xmark width={14} height={14} />
					</button>
				</>
			)}
		</div>
	);
};
