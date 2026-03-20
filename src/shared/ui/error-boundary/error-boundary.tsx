import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Button } from "../button/button";
import styles from "./error-boundary.module.css";

type Props = {
	children: ReactNode;
};

const ErrorFallback = () => {
	const { t } = useTranslation();
	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<h1 className={styles.title}>{t("error.occurred")}</h1>
				<p className={styles.message}>
					{t("error.unexpected")
						.split("\n")
						.map((line, i) => (
							<span key={i}>
								{i > 0 && <br />}
								{line}
							</span>
						))}
				</p>
				<Button variant="primary" onClick={() => window.location.reload()}>
					{t("error.reload")}
				</Button>
			</div>
		</div>
	);
};

export const ErrorBoundary = ({ children }: Props) => {
	return (
		<ReactErrorBoundary fallbackRender={() => <ErrorFallback />}>
			{children}
		</ReactErrorBoundary>
	);
};
