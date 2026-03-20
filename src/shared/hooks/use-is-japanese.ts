import { useTranslation } from "react-i18next";

export const useIsJapanese = (): boolean => {
	const { i18n } = useTranslation();
	return i18n.language === "ja";
};
