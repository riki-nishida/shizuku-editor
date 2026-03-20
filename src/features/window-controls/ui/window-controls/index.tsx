import { useTranslation } from "react-i18next";
import { useWindowControls } from "../../model";
import styles from "./styles.module.css";

export const WindowControls = () => {
	const { t } = useTranslation();
	const { isMac, minimize, toggleMaximize, close } = useWindowControls();

	if (isMac) {
		return (
			<div className={styles.controls}>
				<button
					type="button"
					className={`${styles.controlButton} ${styles.closeButton} ${styles.macButton}`}
					onClick={close}
					onDoubleClick={(e) => e.stopPropagation()}
					aria-label={t("windowControls.close")}
				>
					<span className={styles.macButtonIcon} aria-hidden="true">
						×
					</span>
				</button>
				<button
					type="button"
					className={`${styles.controlButton} ${styles.macButton}`}
					onClick={minimize}
					onDoubleClick={(e) => e.stopPropagation()}
					aria-label={t("windowControls.minimize")}
				>
					<span className={styles.macButtonIcon} aria-hidden="true">
						−
					</span>
				</button>
				<button
					type="button"
					className={`${styles.controlButton} ${styles.macButton}`}
					onClick={toggleMaximize}
					onDoubleClick={(e) => e.stopPropagation()}
					aria-label={t("windowControls.maximizeRestore")}
				>
					<span className={styles.macButtonIcon} aria-hidden="true">
						⤢
					</span>
				</button>
			</div>
		);
	}

	return (
		<div className={styles.controls}>
			<button
				type="button"
				className={styles.controlButton}
				onClick={minimize}
				onDoubleClick={(e) => e.stopPropagation()}
				aria-label={t("windowControls.minimize")}
			>
				<span aria-hidden="true">―</span>
			</button>
			<button
				type="button"
				className={styles.controlButton}
				onClick={toggleMaximize}
				onDoubleClick={(e) => e.stopPropagation()}
				aria-label={t("windowControls.maximizeRestore")}
			>
				<span aria-hidden="true">□</span>
			</button>
			<button
				type="button"
				className={`${styles.controlButton} ${styles.closeButton}`}
				onClick={close}
				onDoubleClick={(e) => e.stopPropagation()}
				aria-label={t("windowControls.close")}
			>
				<span aria-hidden="true">×</span>
			</button>
		</div>
	);
};
