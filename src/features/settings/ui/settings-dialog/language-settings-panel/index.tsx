import { type Language, languageAtom } from "@features/settings";
import { Select } from "@shared/ui/select";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "../settings-section";
import styles from "./styles.module.css";

const LANGUAGES: { code: Language; label: string }[] = [
	{ code: "ja", label: "日本語" },
	{ code: "en", label: "English" },
];

export const LanguageSettingsPanel = () => {
	const { t } = useTranslation();
	const [language, setLanguage] = useAtom(languageAtom);

	const currentLabel =
		LANGUAGES.find((l) => l.code === language)?.label ?? LANGUAGES[0].label;

	return (
		<div className={styles.container}>
			<SettingsSection title={t("settings.language")}>
				<div className={styles.selectRow}>
					<span>{t("settings.language")}</span>
					<Select
						items={LANGUAGES.map((l) => l.label)}
						value={currentLabel}
						onValueChange={({ value }) => {
							const [selected] = value;
							const lang = LANGUAGES.find((l) => l.label === selected);
							if (lang) {
								setLanguage(lang.code);
							}
						}}
						size="sm"
					/>
				</div>
			</SettingsSection>
		</div>
	);
};
