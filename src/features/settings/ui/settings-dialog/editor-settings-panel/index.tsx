import {
	editorSettingsAtom,
	FONT_FAMILY_PRESETS,
	loadSystemFontsAtom,
	systemFontsAtom,
} from "@features/settings";
import { useIsJapanese } from "@shared/hooks/use-is-japanese";
import { FontSelect } from "@shared/ui/font-select";
import { Select } from "@shared/ui/select";
import { Switch } from "@shared/ui/switch";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "../settings-section";
import styles from "./styles.module.css";

export const EditorSettingsPanel = () => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);
	const systemFonts = useAtomValue(systemFontsAtom);
	const loadSystemFonts = useSetAtom(loadSystemFontsAtom);
	const {
		fontFamily,
		fontSize,
		lineHeight,
		writingMode,
		autoIndent,
		focusMode,
	} = editorSettings;

	useEffect(() => {
		loadSystemFonts();
	}, [loadSystemFonts]);

	return (
		<div className={styles.container}>
			<SettingsSection
				title={t("settings.editorPanel.typography")}
				description={t("settings.editorPanel.typographyDesc")}
			>
				<div className={styles.selectRow}>
					<span>{t("settings.editorPanel.fontSize")}</span>
					<Select
						items={["14px", "16px", "18px", "20px"]}
						value={`${fontSize}px`}
						onValueChange={({ value }) => {
							const [selected] = value;
							const fontSize = Number.parseInt(selected, 10);
							setEditorSettings({ fontSize });
						}}
						size="sm"
					/>
				</div>
				<div className={styles.selectRow}>
					<span>{t("settings.editorPanel.fontFamily")}</span>
					<FontSelect
						presets={FONT_FAMILY_PRESETS}
						systemFonts={systemFonts}
						value={fontFamily}
						onValueChange={(value) => {
							setEditorSettings({ fontFamily: value });
						}}
						onPrefetch={loadSystemFonts}
					/>
				</div>
				<div className={styles.selectRow}>
					<span>{t("settings.editorPanel.lineHeight")}</span>
					<Select
						items={["1.6", "1.8", "2.0"]}
						value={lineHeight.toFixed(1)}
						onValueChange={({ value }) => {
							const [selected] = value;
							setEditorSettings({ lineHeight: Number(selected) });
						}}
						size="sm"
					/>
				</div>
			</SettingsSection>
			{isJapanese && (
				<SettingsSection
					title={t("settings.editorPanel.japaneseWriting")}
					description={t("settings.editorPanel.japaneseWritingDesc")}
				>
					<div className={styles.selectRow}>
						<span>{t("settings.editorPanel.writingDirection")}</span>
						<Select
							items={[
								t("settings.editorPanel.horizontal"),
								t("settings.editorPanel.vertical"),
							]}
							value={
								writingMode === "horizontal"
									? t("settings.editorPanel.horizontal")
									: t("settings.editorPanel.vertical")
							}
							onValueChange={({ value }) => {
								const [selected] = value;
								setEditorSettings({
									writingMode:
										selected === t("settings.editorPanel.vertical")
											? "vertical"
											: "horizontal",
								});
							}}
							size="sm"
						/>
					</div>
					<div className={styles.selectRow}>
						<span>{t("settings.editorPanel.rubyDisplay")}</span>
						<Select
							items={[
								t("settings.editorPanel.markupDisplay"),
								t("settings.editorPanel.wysiwygWip"),
							]}
							disabledItems={[t("settings.editorPanel.wysiwygWip")]}
							value={t("settings.editorPanel.markupDisplay")}
							onValueChange={() => {}}
							size="sm"
						/>
					</div>
					<div className={styles.toggleRow}>
						<span>{t("settings.editorPanel.autoIndent")}</span>
						<Switch
							checked={autoIndent}
							onCheckedChange={(checked) =>
								setEditorSettings({ autoIndent: checked })
							}
						/>
					</div>
					<div className={styles.toggleRow}>
						<div className={styles.toggleLabel}>
							<span>{t("settings.editorPanel.gridMode")}</span>
							<span className={styles.toggleDescription}>
								{t("settings.editorPanel.gridModeDesc")}
							</span>
						</div>
						<Switch
							checked={false}
							disabled
							onCheckedChange={(checked) =>
								setEditorSettings({ genkoYoshiMode: checked })
							}
						/>
					</div>
				</SettingsSection>
			)}
			<SettingsSection
				title={t("settings.editorPanel.immersion")}
				description={t("settings.editorPanel.immersionDesc")}
			>
				<div className={styles.toggleRow}>
					<div className={styles.toggleLabel}>
						<span>{t("settings.editorPanel.focusMode")}</span>
						<span className={styles.toggleDescription}>
							{t("settings.editorPanel.focusModeDesc")}
						</span>
					</div>
					<Switch
						checked={focusMode}
						onCheckedChange={(checked) =>
							setEditorSettings({ focusMode: checked })
						}
					/>
				</div>
				<div className={styles.toggleRow}>
					<div className={styles.toggleLabel}>
						<span>{t("settings.editorPanel.typewriterScroll")}</span>
						<span className={styles.toggleDescription}>
							{t("settings.editorPanel.typewriterScrollDesc")}
						</span>
					</div>
					<Switch
						checked={false}
						disabled
						onCheckedChange={(checked) =>
							setEditorSettings({ typewriterMode: checked })
						}
					/>
				</div>
			</SettingsSection>
		</div>
	);
};
