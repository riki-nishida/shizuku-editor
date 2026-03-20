import { Portal } from "@ark-ui/react/portal";
import { useIsJapanese } from "@shared/hooks/use-is-japanese";
import { Dialog } from "@shared/ui/dialog";
import { getVersion } from "@tauri-apps/api/app";
import clsx from "clsx";
import { EditPencil, KeyCommand } from "iconoir-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardShortcutsPanel } from "./keyboard-shortcuts-panel";
import { MarkupReferencePanel } from "./markup-reference-panel";
import styles from "./styles.module.css";

type HelpTab = "shortcuts" | "markup";

const TAB_IDS: HelpTab[] = ["shortcuts", "markup"];

const TAB_KEYS: Record<HelpTab, string> = {
	shortcuts: "help.shortcuts",
	markup: "help.markupReference",
};

const TAB_ICONS: Record<HelpTab, typeof KeyCommand> = {
	shortcuts: KeyCommand,
	markup: EditPencil,
};

const defaultTab: HelpTab = "shortcuts";

type Props = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export const HelpDialog = ({ open = false, onOpenChange }: Props) => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	const setOpen = onOpenChange ?? (() => {});
	const [activeTab, setActiveTab] = useState<HelpTab>(defaultTab);
	const visibleTabs = useMemo(
		() => (isJapanese ? TAB_IDS : TAB_IDS.filter((id) => id !== "markup")),
		[isJapanese],
	);
	const [version, setVersion] = useState("");

	useEffect(() => {
		if (open) {
			setActiveTab(defaultTab);
		}
	}, [open]);

	useEffect(() => {
		void getVersion().then(setVersion);
	}, []);

	return (
		<Dialog.ControlledRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
			{open && (
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content className={styles.content}>
							<Dialog.Header
								title={t("help.title")}
								onClose={() => setOpen(false)}
							/>
							<div className={styles.body}>
								<aside className={styles.sidebar}>
									{visibleTabs.map((id) => {
										const Icon = TAB_ICONS[id];
										return (
											<button
												key={id}
												type="button"
												className={clsx(styles.tabButton, {
													[styles.tabButtonActive]: activeTab === id,
												})}
												onClick={() => setActiveTab(id)}
											>
												<Icon width="1.25rem" height="1.25rem" />
												<span>{t(TAB_KEYS[id])}</span>
											</button>
										);
									})}
								</aside>
								<main className={styles.panel}>
									{activeTab === "shortcuts" && <KeyboardShortcutsPanel />}
									{activeTab === "markup" && <MarkupReferencePanel />}
								</main>
							</div>
							{version && (
								<div className={styles.footer}>
									<span className={styles.version}>
										{t("help.versionPrefix")}
										{version}
									</span>
								</div>
							)}
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			)}
		</Dialog.ControlledRoot>
	);
};
