import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getWorkStatistics } from "../../model";
import { workStatsAtom } from "./store";
import styles from "./styles.module.css";

type WorkStatisticsFooterProps = {
	workId: string | null;
};

export const WorkStatisticsFooter = ({ workId }: WorkStatisticsFooterProps) => {
	const { t } = useTranslation();
	const workStats = useAtomValue(workStatsAtom);
	const setWorkStats = useSetAtom(workStatsAtom);

	useEffect(() => {
		if (!workId) {
			setWorkStats(null);
			return;
		}

		const fetchStats = async () => {
			const result = await getWorkStatistics(workId);
			if (result.ok) {
				setWorkStats(result.value);
			}
		};

		const interval = setInterval(fetchStats, 1000);
		return () => clearInterval(interval);
	}, [workId, setWorkStats]);

	return (
		<footer className={styles.footer}>
			<span className={styles.value}>
				{workStats
					? `${workStats.total_word_count.toLocaleString()}${t("common.characters")}`
					: "\u00A0"}
			</span>
		</footer>
	);
};
