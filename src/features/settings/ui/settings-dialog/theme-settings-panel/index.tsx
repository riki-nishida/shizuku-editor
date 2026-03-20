import { themeSettingsAtom } from "@features/settings";
import { Select } from "@shared/ui/select";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "../settings-section";
import styles from "./styles.module.css";

export const ThemeSettingsPanel = () => {
	const { t } = useTranslation();
	const [themeSettings, setThemeSettings] = useAtom(themeSettingsAtom);

	const lightLabel = t("menu.light");
	const darkLabel = t("menu.dark");

	return (
		<div className={styles.container}>
			<SettingsSection
				title={t("settings.themePanel.title")}
				description={t("settings.themePanel.description")}
			>
				<div className={styles.selectRow}>
					<span>{t("settings.theme")}</span>
					<Select
						items={[lightLabel, darkLabel]}
						value={themeSettings.theme === "light" ? lightLabel : darkLabel}
						onValueChange={({ value }) => {
							const [selected] = value;
							const theme = selected === lightLabel ? "light" : "dark";
							setThemeSettings({ theme });
						}}
						size="sm"
					/>
				</div>
			</SettingsSection>
		</div>
	);
};
