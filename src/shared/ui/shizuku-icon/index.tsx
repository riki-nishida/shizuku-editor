import { useId } from "react";
import { useTranslation } from "react-i18next";

type Props = {
	size?: number;
	className?: string;
	variant?: "light" | "dark";
};

const gradientColors = {
	light: { start: "#1a1918", end: "#545350" },
	dark: { start: "#ffffff", end: "#a0a0a0" },
};

export const ShizukuIcon = ({
	size = 18,
	className,
	variant = "light",
}: Props) => {
	const { t } = useTranslation();
	const gradientId = useId();
	const colors = gradientColors[variant];

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label={t("help.appName")}
			className={className}
		>
			<defs>
				<linearGradient
					id={gradientId}
					x1="16"
					y1="0"
					x2="16"
					y2="32"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor={colors.start} />
					<stop offset="1" stopColor={colors.end} />
				</linearGradient>
			</defs>
			<path
				d="M16 3.2L22.4 20C22.4 24.2 19.62 27.6 16 27.6C12.38 27.6 9.6 24.2 9.6 20L16 3.2Z"
				fill={`url(#${gradientId})`}
			/>
		</svg>
	);
};
