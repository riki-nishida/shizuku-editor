import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const SUPPORTED_LANGUAGES = ["ja", "en"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const detectLanguage = (): SupportedLanguage => {
	const browserLang = navigator.language.split("-")[0];
	if (browserLang === "ja") {
		return "ja";
	}
	return "en";
};

i18n.use(initReactI18next).init({
	resources: {
		ja: { translation: ja },
		en: { translation: en },
	},
	lng: detectLanguage(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
