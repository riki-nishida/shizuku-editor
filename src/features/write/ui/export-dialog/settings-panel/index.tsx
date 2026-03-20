import { useIsJapanese } from "@shared/hooks/use-is-japanese";
import { Checkbox } from "@shared/ui/checkbox/checkbox";
import { Input } from "@shared/ui/input/input";
import { Switch } from "@shared/ui/switch/switch";
import { NavArrowDown, NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
	ExportFormat,
	ExportMode,
	ExportSettings,
	PdfPageSize,
	RubyMode,
} from "../../../model/export/types";
import type { ChapterWithScenes } from "../use-export-scene-selection";
import styles from "./styles.module.css";

const FORMAT_LABELS: Record<ExportFormat, string> = {
	txt: "TXT",
	docx: "DOCX",
	pdf: "PDF",
	epub: "ePub",
};

const FORMATS: ExportFormat[] = ["txt", "docx", "pdf", "epub"];

const RUBY_MODES: { value: RubyMode; labelKey: string }[] = [
	{ value: "paren", labelKey: "exportDialog.rubyParentheses" },
	{ value: "angle", labelKey: "exportDialog.rubyAngleBrackets" },
];

const EXPORT_MODES: { value: ExportMode; labelKey: string }[] = [
	{ value: "single-file", labelKey: "exportDialog.splitSingle" },
	{ value: "per-chapter", labelKey: "exportDialog.splitByChapter" },
	{ value: "per-scene", labelKey: "exportDialog.splitByScene" },
];

const PAGE_SIZES: { value: PdfPageSize; label: string }[] = [
	{ value: "a4", label: "A4" },
	{ value: "a5", label: "A5" },
	{ value: "b5", label: "B5" },
];

type SettingsPanelProps = {
	settings: ExportSettings;
	updateSetting: <K extends keyof ExportSettings>(
		key: K,
		value: ExportSettings[K],
	) => void;
	sceneCount: number;
	totalWordCount: number;
	collapsed: boolean;
	onToggleCollapse: () => void;
	onExport: () => void;
	isExporting: boolean;
	canExport: boolean;
	chapters: ChapterWithScenes[];
	selectedSceneIds: Set<string>;
	expandedChapters: Record<string, boolean>;
	allCheckedState: boolean | "indeterminate";
	getChapterCheckedState: (chapterId: string) => boolean | "indeterminate";
	onToggleScene: (sceneId: string) => void;
	onToggleChapter: (chapterId: string) => void;
	onToggleExpanded: (chapterId: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
};

export const SettingsPanel = ({
	settings,
	updateSetting,
	sceneCount,
	collapsed,
	onToggleCollapse,
	onExport,
	isExporting,
	canExport,
	chapters,
	selectedSceneIds,
	expandedChapters,
	allCheckedState,
	getChapterCheckedState,
	onToggleScene,
	onToggleChapter,
	onToggleExpanded,
	onSelectAll,
	onDeselectAll,
}: SettingsPanelProps) => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	const [scopeExpanded, setScopeExpanded] = useState(false);

	const handleAllChange = () => {
		if (allCheckedState === true) {
			onDeselectAll();
		} else {
			onSelectAll();
		}
	};

	return (
		<>
			<div
				className={
					collapsed ? styles.collapsedRail : styles.collapsedRailHidden
				}
			>
				<button
					type="button"
					className={styles.expandButton}
					onClick={onToggleCollapse}
					title={t("exportDialog.openPanel")}
				>
					<NavArrowRight width={14} height={14} />
				</button>
				<span className={styles.railLabel}>{t("exportDialog.settings")}</span>
			</div>

			<div className={collapsed ? styles.panelHidden : styles.panel}>
				<div className={styles.panelHeader}>
					<span className={styles.panelTitle}>
						{t("exportDialog.settings")}
					</span>
					<button
						type="button"
						className={styles.iconButton}
						onClick={onToggleCollapse}
						title={t("exportDialog.collapsePanel")}
					>
						<NavArrowLeft width={14} height={14} />
					</button>
				</div>

				<div className={styles.panelBody}>
					<div className={styles.group}>
						<span className={styles.groupLabel}>
							{t("exportDialog.format")}
						</span>
						<div className={styles.formatRow}>
							{FORMATS.map((fmt) => (
								<button
									key={fmt}
									type="button"
									className={`${styles.formatButton} ${settings.format === fmt ? styles.formatButtonSelected : ""}`}
									onClick={() => updateSetting("format", fmt)}
								>
									{FORMAT_LABELS[fmt]}
								</button>
							))}
						</div>
					</div>

					{isJapanese &&
						(settings.format === "docx" || settings.format === "epub") && (
							<div className={styles.group}>
								<span className={styles.groupLabel}>
									{t("exportDialog.writingDirection")}
								</span>
								<div className={styles.directionPills}>
									<button
										type="button"
										className={`${styles.directionPill} ${settings.writingMode === "vertical" ? styles.directionPillActive : ""}`}
										onClick={() => updateSetting("writingMode", "vertical")}
									>
										{t("exportDialog.vertical")}
									</button>
									<button
										type="button"
										className={`${styles.directionPill} ${settings.writingMode === "horizontal" ? styles.directionPillActive : ""}`}
										onClick={() => updateSetting("writingMode", "horizontal")}
									>
										{t("exportDialog.horizontal")}
									</button>
								</div>
							</div>
						)}

					<div className={styles.group}>
						<span className={styles.groupLabel}>
							{t("exportDialog.headingFormatting")}
						</span>
						<div className={styles.optionRow}>
							<span className={styles.optionLabel}>
								{t("exportDialog.chapterTitle")}
							</span>
							<Switch
								checked={settings.includeChapterTitles}
								onCheckedChange={(checked) =>
									updateSetting("includeChapterTitles", checked)
								}
							/>
						</div>
						<div className={styles.optionRow}>
							<span className={styles.optionLabel}>
								{t("exportDialog.sceneTitle")}
							</span>
							<Switch
								checked={settings.includeSceneTitles}
								onCheckedChange={(checked) =>
									updateSetting("includeSceneTitles", checked)
								}
							/>
						</div>
					</div>

					<FormatSpecificOptions
						settings={settings}
						updateSetting={updateSetting}
					/>

					<div className={styles.group}>
						<button
							type="button"
							className={styles.accordionHeader}
							onClick={() => setScopeExpanded((prev) => !prev)}
							aria-expanded={scopeExpanded}
						>
							{scopeExpanded ? (
								<NavArrowDown width={12} height={12} />
							) : (
								<NavArrowRight width={12} height={12} />
							)}
							<span className={styles.accordionLabel}>
								{t("exportDialog.outputRange")}
							</span>
							<span className={styles.accordionSummary}>
								{sceneCount} {t("exportDialog.scenes")}
							</span>
						</button>
						{scopeExpanded && (
							<div className={styles.scopeTree}>
								<div className={styles.scopeAllRow}>
									<Checkbox
										size="xs"
										checked={allCheckedState}
										onCheckedChange={handleAllChange}
										label={t("common.selectAll")}
									/>
								</div>
								{chapters.map((chapter) => {
									const isExpanded = expandedChapters[chapter.id] !== false;
									const checkedState = getChapterCheckedState(chapter.id);
									const chapterWordCount = chapter.scenes.reduce(
										(sum, s) => sum + s.word_count,
										0,
									);

									return (
										<div key={chapter.id} className={styles.chapterGroup}>
											<div className={styles.chapterRow}>
												<button
													type="button"
													className={styles.treeExpandButton}
													onClick={() => onToggleExpanded(chapter.id)}
													aria-expanded={isExpanded}
													aria-label={
														isExpanded
															? t("common.collapse")
															: t("common.expand")
													}
												>
													{isExpanded ? (
														<NavArrowDown width={12} height={12} />
													) : (
														<NavArrowRight width={12} height={12} />
													)}
												</button>
												<Checkbox
													size="xs"
													checked={checkedState}
													onCheckedChange={() => onToggleChapter(chapter.id)}
												/>
												<span className={styles.chapterTitle}>
													{chapter.title}
												</span>
												<span className={styles.wordCount}>
													{chapterWordCount.toLocaleString()}
													{t("common.characters")}
												</span>
											</div>

											{isExpanded && (
												<div className={styles.sceneList}>
													{chapter.scenes.map((scene) => (
														<div key={scene.id} className={styles.sceneRow}>
															<Checkbox
																size="xs"
																checked={selectedSceneIds.has(scene.id)}
																onCheckedChange={() => onToggleScene(scene.id)}
															/>
															<span className={styles.sceneTitle}>
																{scene.title}
															</span>
															<span className={styles.wordCount}>
																{scene.word_count.toLocaleString()}
																{t("common.characters")}
															</span>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				<div className={styles.panelFooter}>
					<button
						type="button"
						className={styles.exportButton}
						onClick={onExport}
						disabled={!canExport || isExporting}
					>
						{t("exportDialog.export")}
					</button>
				</div>
			</div>
		</>
	);
};

type FormatSpecificOptionsProps = {
	settings: ExportSettings;
	updateSetting: <K extends keyof ExportSettings>(
		key: K,
		value: ExportSettings[K],
	) => void;
};

const FormatSpecificOptions = ({
	settings,
	updateSetting,
}: FormatSpecificOptionsProps) => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	if (settings.format === "txt") {
		return (
			<div className={styles.group}>
				<span className={styles.groupLabel}>
					{t("exportDialog.txtSettings")}
				</span>
				{isJapanese && (
					<div className={styles.subGroup}>
						<span className={styles.subGroupLabel}>
							{t("exportDialog.rubyMode")}
						</span>
						<div className={styles.pillRow}>
							{RUBY_MODES.map((m) => (
								<button
									key={m.value}
									type="button"
									className={`${styles.pill} ${settings.rubyMode === m.value ? styles.pillActive : ""}`}
									onClick={() => updateSetting("rubyMode", m.value)}
								>
									{t(m.labelKey)}
								</button>
							))}
						</div>
					</div>
				)}
				<div className={styles.subGroup}>
					<span className={styles.subGroupLabel}>
						{t("exportDialog.fileSplit")}
					</span>
					<div className={styles.pillRow}>
						{EXPORT_MODES.map((m) => (
							<button
								key={m.value}
								type="button"
								className={`${styles.pill} ${settings.mode === m.value ? styles.pillActive : ""}`}
								onClick={() => updateSetting("mode", m.value)}
							>
								{t(m.labelKey)}
							</button>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (settings.format === "pdf") {
		return (
			<div className={styles.group}>
				<span className={styles.groupLabel}>
					{t("exportDialog.pdfSettings")}
				</span>
				{isJapanese && (
					<div className={styles.subGroup}>
						<span className={styles.subGroupLabel}>
							{t("exportDialog.rubyMode")}
						</span>
						<div className={styles.pillRow}>
							{RUBY_MODES.map((m) => (
								<button
									key={m.value}
									type="button"
									className={`${styles.pill} ${settings.rubyMode === m.value ? styles.pillActive : ""}`}
									onClick={() => updateSetting("rubyMode", m.value)}
								>
									{t(m.labelKey)}
								</button>
							))}
						</div>
					</div>
				)}
				<div className={styles.subGroup}>
					<span className={styles.subGroupLabel}>
						{t("exportDialog.paperSize")}
					</span>
					<div className={styles.pillRow}>
						{PAGE_SIZES.map((s) => (
							<button
								key={s.value}
								type="button"
								className={`${styles.pill} ${settings.pageSize === s.value ? styles.pillActive : ""}`}
								onClick={() => updateSetting("pageSize", s.value)}
							>
								{s.label}
							</button>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (settings.format === "epub") {
		return (
			<div className={styles.group}>
				<span className={styles.groupLabel}>
					{t("exportDialog.epubSettings")}
				</span>
				<Input
					inputSize="sm"
					value={settings.author}
					onChange={(e) => updateSetting("author", e.target.value)}
					placeholder={t("exportDialog.authorPlaceholder")}
					label={t("exportDialog.authorLabel")}
				/>
			</div>
		);
	}

	return null;
};
