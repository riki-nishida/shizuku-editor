import { Dialog, useDialog } from "@shared/ui/dialog";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

const COPYRIGHT_YEAR = "2026";
const COPYRIGHT_HOLDER = "Riki Nishida";

type AboutDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
	const { t } = useTranslation();
	const dialog = useDialog();
	const [version, setVersion] = useState("");

	useEffect(() => {
		dialog.setOpen(open);
	}, [open, dialog.setOpen]);

	useEffect(() => {
		if (!dialog.open) {
			onOpenChange(false);
		}
	}, [dialog.open, onOpenChange]);

	useEffect(() => {
		void getVersion().then(setVersion);
	}, []);

	return (
		<Dialog.Root value={dialog}>
			<Dialog.Frame open={dialog.open}>
				<Dialog.Content className={styles.content}>
					<div className={styles.body}>
						<div className={styles.icon}>
							<img
								src="/icon.svg"
								alt={t("help.appName")}
								width={80}
								height={80}
							/>
						</div>
						<h1 className={styles.appName}>{t("help.appName")}</h1>
						{version && <p className={styles.version}>Version {version}</p>}
						<p className={styles.copyright}>
							&copy; {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}
						</p>
					</div>
				</Dialog.Content>
			</Dialog.Frame>
		</Dialog.Root>
	);
};
