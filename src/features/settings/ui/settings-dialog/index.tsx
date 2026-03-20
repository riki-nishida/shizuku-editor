import { Portal } from "@ark-ui/react/portal";
import { settingsDialogInitialTabAtom } from "@shared/store/ui";
import { Dialog } from "@shared/ui/dialog";
import clsx from "clsx";
import {
	DatabaseBackup,
	Download,
	Language,
	Palette,
	Settings as SettingsIcon,
} from "iconoir-react";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackupSettingsPanel } from "./backup-settings-panel";
import { EditorSettingsPanel } from "./editor-settings-panel";
import { LanguageSettingsPanel } from "./language-settings-panel";
import styles from "./styles.module.css";
import { ThemeSettingsPanel } from "./theme-settings-panel";
import { UpdateSettingsPanel } from "./update-settings-panel";

type SettingsCategory = "editor" | "theme" | "language" | "backup" | "update";

const CATEGORY_KEYS: Record<SettingsCategory, string> = {
	editor: "settings.editor",
	theme: "settings.theme",
	language: "settings.language",
	backup: "settings.backup",
	update: "settings.update",
};

const CATEGORY_ICONS: Record<SettingsCategory, typeof SettingsIcon> = {
	editor: SettingsIcon,
	theme: Palette,
	language: Language,
	backup: DatabaseBackup,
	update: Download,
};

const CATEGORY_IDS: SettingsCategory[] = [
	"editor",
	"theme",
	"language",
	"backup",
	"update",
];

const defaultCategory: SettingsCategory = "editor";

type Props = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export const SettingsDialog = ({ open = false, onOpenChange }: Props) => {
	const { t } = useTranslation();
	const setOpen = onOpenChange ?? (() => {});
	const [initialTab, setInitialTab] = useAtom(settingsDialogInitialTabAtom);
	const initialTabRef = useRef(initialTab);
	initialTabRef.current = initialTab;

	const [activeCategory, setActiveCategory] =
		useState<SettingsCategory>(defaultCategory);

	useEffect(() => {
		if (!open) return;
		const tab = initialTabRef.current as SettingsCategory | null;
		setActiveCategory(tab ?? defaultCategory);
		if (tab) {
			setInitialTab(null);
		}
	}, [open, setInitialTab]);

	return (
		<Dialog.ControlledRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
			{open && (
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header
								title={t("settings.title")}
								onClose={() => setOpen(false)}
							/>
							<div className={styles.body}>
								<aside className={styles.sidebar}>
									{CATEGORY_IDS.map((id) => {
										const Icon = CATEGORY_ICONS[id];
										return (
											<button
												key={id}
												type="button"
												className={clsx(styles.categoryButton, {
													[styles.categoryButtonActive]: activeCategory === id,
												})}
												onClick={() => setActiveCategory(id)}
											>
												<Icon width="1.25rem" height="1.25rem" />
												<span>{t(CATEGORY_KEYS[id])}</span>
											</button>
										);
									})}
								</aside>
								<main className={styles.panel}>
									{activeCategory === "editor" && <EditorSettingsPanel />}
									{activeCategory === "theme" && <ThemeSettingsPanel />}
									{activeCategory === "language" && <LanguageSettingsPanel />}
									{activeCategory === "backup" && <BackupSettingsPanel />}
									{activeCategory === "update" && <UpdateSettingsPanel />}
								</main>
							</div>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			)}
		</Dialog.ControlledRoot>
	);
};
