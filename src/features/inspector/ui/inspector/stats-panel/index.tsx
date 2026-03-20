import { formatDate } from "@shared/lib/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { calcStats } from "./calc-stats";
import styles from "./styles.module.css";

const DEBOUNCE_MS = 1000;

type StatsPanelProps = {
	contentText: string;
	updatedAt: string;
};

export const StatsPanel = ({ contentText, updatedAt }: StatsPanelProps) => {
	const { t } = useTranslation();
	const formattedUpdatedAt = useMemo(
		() => (updatedAt ? formatDate(updatedAt) : null),
		[updatedAt],
	);

	const [debouncedText, setDebouncedText] = useState(contentText);
	const isFirstContentRef = useRef(true);

	useEffect(() => {
		if (isFirstContentRef.current) {
			setDebouncedText(contentText);
			if (contentText !== "") {
				isFirstContentRef.current = false;
			}
			return;
		}
		const timer = setTimeout(() => setDebouncedText(contentText), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [contentText]);

	const stats = useMemo(() => calcStats(debouncedText), [debouncedText]);

	return (
		<div className={styles.panel}>
			<div className={styles.grid}>
				<div className={styles.stat}>
					<div className={styles.statLabel}>
						{t("inspector.stats.charCount")}
					</div>
					<div className={styles.statValue}>
						{stats.charCount.toLocaleString()}
						<span className={styles.statUnit}>{t("common.characters")}</span>
					</div>
				</div>
				<div className={styles.stat}>
					<div className={styles.statLabel}>
						{t("inspector.stats.withSpaces")}
					</div>
					<div className={styles.statValue}>
						{stats.charCountWithSpaces.toLocaleString()}
						<span className={styles.statUnit}>{t("common.characters")}</span>
					</div>
				</div>
				<div className={styles.stat}>
					<div className={styles.statLabel}>
						{t("inspector.stats.paragraphs")}
					</div>
					<div className={styles.statValue}>{stats.paragraphCount}</div>
				</div>
				<div className={styles.stat}>
					<div className={styles.statLabel}>
						{t("inspector.stats.readingTime")}
					</div>
					<div className={styles.statValue}>
						{t("common.approx")} {stats.readingMinutes}
						<span className={styles.statUnit}>{t("common.minuteUnit")}</span>
					</div>
				</div>
			</div>
			{formattedUpdatedAt && (
				<div className={styles.metaRow}>
					<span className={styles.metaLabel}>
						{t("inspector.stats.updated")}
					</span>
					<span className={styles.metaValue}>{formattedUpdatedAt}</span>
				</div>
			)}
		</div>
	);
};
