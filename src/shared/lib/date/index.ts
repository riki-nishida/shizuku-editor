import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ja";
import "dayjs/locale/en";
import i18n from "@shared/lib/i18n";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const getDayjsLocale = () => (i18n.language === "ja" ? "ja" : "en");

export const formatDate = (dateString: string): string => {
	return dayjs
		.utc(dateString)
		.local()
		.locale(getDayjsLocale())
		.format(i18n.t("date.format"));
};

export const formatRelativeDate = (dateString: string): string => {
	const date = dayjs.utc(dateString).local();
	const now = dayjs();
	const diffInHours = now.diff(date, "hour");
	const diffInDays = now.diff(date, "day");

	if (diffInHours < 1) {
		return i18n.t("date.justNow");
	}
	if (diffInHours < 24) {
		return i18n.t("date.hoursAgo", { count: diffInHours });
	}
	if (diffInDays < 7) {
		return i18n.t("date.daysAgo", { count: diffInDays });
	}
	if (diffInDays < 30) {
		return i18n.t("date.weeksAgo", { count: Math.floor(diffInDays / 7) });
	}
	return date.locale(getDayjsLocale()).format(i18n.t("date.formatShort"));
};

export const formatDayOfWeek = (dateString: string): string => {
	const date = dayjs(dateString);
	const days = i18n.t("date.days", { returnObjects: true }) as string[];
	return days[date.day()];
};
