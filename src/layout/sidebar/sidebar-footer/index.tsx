import { useStructuredOutline } from "@features/write/model/outline/hooks/use-structured-outline";
import { outlineNodesAtom } from "@features/write/model/outline/store";
import { TrashPopoverContent } from "@features/write/ui/outline/trash/trash-popover-content";
import {
	keyboardShortcutsDialogOpenAtom,
	settingsDialogOpenAtom,
} from "@shared/store/ui";
import { IconButton } from "@shared/ui/icon-button/icon-button";
import { Popover } from "@shared/ui/popover";
import { HelpCircle, Settings, Trash } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

export const SidebarFooter = () => {
	const { t } = useTranslation();
	const setSettingsOpen = useSetAtom(settingsDialogOpenAtom);
	const setHelpOpen = useSetAtom(keyboardShortcutsDialogOpenAtom);

	const nodes = useAtomValue(outlineNodesAtom);
	const { deleted, orphaned } = useStructuredOutline({ nodes });
	const hasTrashItems = deleted.length > 0 || orphaned.length > 0;

	return (
		<footer className={styles.footer}>
			<div className={styles.leftGroup}>
				<IconButton
					tooltip={t("sidebar.settings")}
					onClick={() => setSettingsOpen(true)}
				>
					<Settings width={18} height={18} />
				</IconButton>
				<IconButton
					tooltip={t("sidebar.keyboardShortcuts")}
					onClick={() => setHelpOpen(true)}
				>
					<HelpCircle width={18} height={18} />
				</IconButton>
			</div>
			{hasTrashItems && (
				<Popover
					trigger={
						<IconButton tooltip={t("sidebar.trash")}>
							<Trash width={18} height={18} />
						</IconButton>
					}
				>
					<TrashPopoverContent chapters={deleted} scenes={orphaned} />
				</Popover>
			)}
		</footer>
	);
};
