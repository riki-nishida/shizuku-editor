import { Toast, Toaster } from "@ark-ui/react/toast";
import { type ToastAction, toaster } from "@shared/lib/toast";
import { Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

export const ToastContainer = () => {
	const { t } = useTranslation();
	return (
		<Toaster toaster={toaster} className={styles.container}>
			{(toast) => (
				<Toast.Root
					key={toast.id}
					className={`${styles.toast} ${styles[toast.type ?? "info"]}`}
				>
					<div className={styles.content}>
						<Toast.Description className={styles.message}>
							{toast.description}
						</Toast.Description>
						{(toast.meta as { action?: ToastAction })?.action && (
							<Toast.ActionTrigger
								className={styles.actionButton}
								onClick={(toast.meta as { action: ToastAction }).action.onClick}
							>
								{(toast.meta as { action: ToastAction }).action.label}
							</Toast.ActionTrigger>
						)}
					</div>
					<Toast.CloseTrigger
						className={styles.closeButton}
						aria-label={t("common.close")}
					>
						<Xmark width={16} height={16} />
					</Toast.CloseTrigger>
				</Toast.Root>
			)}
		</Toaster>
	);
};
