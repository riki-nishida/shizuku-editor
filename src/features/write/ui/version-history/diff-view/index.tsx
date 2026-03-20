import { diff_match_patch } from "diff-match-patch";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type DiffMode = "unified" | "side-by-side";

type Props = {
	oldText: string;
	newText: string;
	mode?: DiffMode;
};

type DiffSegment = {
	type: "equal" | "insert" | "delete";
	text: string;
};

type LinePair = {
	id: string;
	oldLine: DiffSegment[];
	newLine: DiffSegment[];
	hasChanges: boolean;
};

type UnifiedLine = {
	id: string;
	segments: DiffSegment[];
	lineType: "equal" | "insert" | "delete" | "mixed";
};

export const DiffView = ({
	oldText,
	newText,
	mode = "side-by-side",
}: Props) => {
	const { t } = useTranslation();
	const diffSegments = useMemo((): DiffSegment[] => {
		const dmp = new diff_match_patch();
		const diffs = dmp.diff_main(oldText, newText);
		dmp.diff_cleanupSemantic(diffs);

		return diffs.map(([operation, text]) => {
			let type: "equal" | "insert" | "delete";
			switch (operation) {
				case 1:
					type = "insert";
					break;
				case -1:
					type = "delete";
					break;
				default:
					type = "equal";
			}
			return { type, text };
		});
	}, [oldText, newText]);

	const linePairs = useMemo((): LinePair[] => {
		if (mode !== "side-by-side") return [];

		const pairs: LinePair[] = [];
		let currentOldLine: DiffSegment[] = [];
		let currentNewLine: DiffSegment[] = [];
		let hasChangesInLine = false;
		let lineCounter = 0;

		const flushLine = () => {
			if (currentOldLine.length > 0 || currentNewLine.length > 0) {
				pairs.push({
					id: `line-${lineCounter++}`,
					oldLine: currentOldLine,
					newLine: currentNewLine,
					hasChanges: hasChangesInLine,
				});
				currentOldLine = [];
				currentNewLine = [];
				hasChangesInLine = false;
			}
		};

		for (const segment of diffSegments) {
			const lines = segment.text.split("\n");

			for (let i = 0; i < lines.length; i++) {
				const lineText = lines[i];
				const isLastPart = i === lines.length - 1;

				if (lineText || !isLastPart) {
					const seg: DiffSegment = { type: segment.type, text: lineText };

					if (segment.type === "equal") {
						currentOldLine.push(seg);
						currentNewLine.push(seg);
					} else if (segment.type === "delete") {
						currentOldLine.push(seg);
						hasChangesInLine = true;
					} else if (segment.type === "insert") {
						currentNewLine.push(seg);
						hasChangesInLine = true;
					}
				}

				if (!isLastPart) {
					flushLine();
				}
			}
		}

		flushLine();
		return pairs;
	}, [diffSegments, mode]);

	const unifiedLines = useMemo((): UnifiedLine[] => {
		if (mode !== "unified") return [];

		const lines: UnifiedLine[] = [];
		let currentLine: DiffSegment[] = [];
		let lineCounter = 0;

		const flushLine = () => {
			if (currentLine.length > 0) {
				const types = new Set(currentLine.map((s) => s.type));
				let lineType: UnifiedLine["lineType"] = "equal";
				if (types.has("insert") && types.has("delete")) {
					lineType = "mixed";
				} else if (types.has("insert") && !types.has("delete")) {
					lineType = types.has("equal") ? "mixed" : "insert";
				} else if (types.has("delete") && !types.has("insert")) {
					lineType = types.has("equal") ? "mixed" : "delete";
				}

				lines.push({
					id: `uline-${lineCounter++}`,
					segments: currentLine,
					lineType,
				});
				currentLine = [];
			}
		};

		for (const segment of diffSegments) {
			const parts = segment.text.split("\n");

			for (let i = 0; i < parts.length; i++) {
				const text = parts[i];
				const isLastPart = i === parts.length - 1;

				if (text || !isLastPart) {
					currentLine.push({ type: segment.type, text });
				}

				if (!isLastPart) {
					flushLine();
				}
			}
		}

		flushLine();
		return lines;
	}, [diffSegments, mode]);

	const hasChanges = useMemo(
		() => diffSegments.some((seg) => seg.type !== "equal"),
		[diffSegments],
	);

	const stats = useMemo(() => {
		let added = 0;
		let deleted = 0;
		for (const seg of diffSegments) {
			const charCount = seg.text.replace(/\s/g, "").length;
			if (seg.type === "insert") added += charCount;
			if (seg.type === "delete") deleted += charCount;
		}
		return { added, deleted, net: added - deleted };
	}, [diffSegments]);

	if (!hasChanges) {
		return (
			<div className={styles.noChanges}>{t("versionHistory.noChanges")}</div>
		);
	}

	const renderStats = () => (
		<div className={styles.statsBar}>
			{stats.added > 0 && (
				<span className={styles.statAdded}>+{stats.added}</span>
			)}
			{stats.deleted > 0 && (
				<span className={styles.statDeleted}>-{stats.deleted}</span>
			)}
			<span className={styles.statNet}>
				{t("versionHistory.charsOpen")}
				{stats.net >= 0 ? "+" : ""}
				{stats.net}
				{t("versionHistory.charsCount")}
			</span>
		</div>
	);

	if (mode === "side-by-side") {
		return (
			<div className={styles.container}>
				{renderStats()}
				<div className={styles.sideBySide}>
					<div className={styles.sideHeader}>
						<span className={styles.sideLabel}>
							{t("versionHistory.oldVersion")}
						</span>
						<div className={styles.sideHeaderDivider} />
						<span className={styles.sideLabel}>
							{t("versionHistory.current")}
						</span>
					</div>
					<div className={styles.sideContent}>
						<div className={styles.sidePane}>
							{linePairs.map((pair) => (
								<div
									key={`old-${pair.id}`}
									className={`${styles.sideLine} ${pair.hasChanges ? styles.sideLineChanged : ""}`}
								>
									{pair.oldLine.map((seg, segIdx) => (
										<span
											key={`${seg.type}-${segIdx}`}
											className={
												seg.type === "delete" ? styles.deleteHighlight : ""
											}
										>
											{seg.text}
										</span>
									))}
									{pair.oldLine.length === 0 && (
										<span className={styles.emptyLine}>&nbsp;</span>
									)}
								</div>
							))}
						</div>
						<div className={styles.sideDivider} />
						<div className={styles.sidePane}>
							{linePairs.map((pair) => (
								<div
									key={`new-${pair.id}`}
									className={`${styles.sideLine} ${pair.hasChanges ? styles.sideLineChanged : ""}`}
								>
									{pair.newLine.map((seg, segIdx) => (
										<span
											key={`${seg.type}-${segIdx}`}
											className={
												seg.type === "insert" ? styles.insertHighlight : ""
											}
										>
											{seg.text}
										</span>
									))}
									{pair.newLine.length === 0 && (
										<span className={styles.emptyLine}>&nbsp;</span>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{renderStats()}
			<div className={styles.unifiedContent}>
				{unifiedLines.map((line) => (
					<div
						key={line.id}
						className={`${styles.unifiedLine} ${
							line.lineType === "delete"
								? styles.unifiedLineDelete
								: line.lineType === "insert"
									? styles.unifiedLineInsert
									: line.lineType === "mixed"
										? styles.unifiedLineChanged
										: ""
						}`}
					>
						{line.segments.map((seg, segIdx) => (
							<span
								key={`${seg.type}-${segIdx}`}
								className={
									seg.type === "delete"
										? styles.deleteHighlight
										: seg.type === "insert"
											? styles.insertHighlight
											: ""
								}
							>
								{seg.text}
							</span>
						))}
						{line.segments.length === 0 && <span>&nbsp;</span>}
					</div>
				))}
			</div>
		</div>
	);
};
