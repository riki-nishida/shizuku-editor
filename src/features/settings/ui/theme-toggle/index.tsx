import { themeSettingsAtom } from "@features/settings";
import { IconButton } from "@shared/ui/icon-button/icon-button";
import { HalfMoon, SunLight } from "iconoir-react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export const ThemeToggle = () => {
	const { t } = useTranslation();
	const [themeSettings, setThemeSettings] = useAtom(themeSettingsAtom);

	const handleToggle = useCallback(() => {
		const nextTheme = themeSettings.theme === "dark" ? "light" : "dark";
		setThemeSettings({ theme: nextTheme });
	}, [themeSettings.theme, setThemeSettings]);

	const isDarkTheme = themeSettings.theme === "dark";
	const Icon = isDarkTheme ? SunLight : HalfMoon;
	const label = isDarkTheme
		? t("settings.themeToggle.toLight")
		: t("settings.themeToggle.toDark");

	return (
		<IconButton
			tooltip={label}
			onClick={handleToggle}
			onDoubleClick={(e) => e.stopPropagation()}
		>
			<Icon width={16} height={16} />
		</IconButton>
	);
};
