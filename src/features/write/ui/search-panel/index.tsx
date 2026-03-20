import { IconButton } from "@shared/ui/icon-button";
import { Input } from "@shared/ui/input";
import { Tooltip } from "@shared/ui/tooltip/tooltip";
import { Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import type { SearchMatch } from "../../model/search/types";
import styles from "./styles.module.css";
import { useProjectSearch } from "./use-project-search";

export const SearchPanel = () => {
	const { t } = useTranslation();
	const {
		query,
		setQuery,
		caseSensitive,
		setCaseSensitive,
		replaceText,
		setReplaceText,
		searchResult,
		selectedIndex,
		handleClose,
		handleMatchClick,
		handleReplaceAll,
		handleKeyDown,
	} = useProjectSearch();

	const matches = searchResult?.matches ?? [];

	return (
		<section className={styles.root}>
			<div className={styles.searchSection}>
				<div className={styles.inputRow}>
					<Input
						type="text"
						inputSize="sm"
						className={styles.searchInput}
						placeholder={t("search.placeholder")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<Tooltip content={t("search.caseSensitive")}>
						<button
							type="button"
							className={styles.caseSensitiveButton}
							onClick={() => setCaseSensitive(!caseSensitive)}
							data-active={caseSensitive}
							aria-label={t("search.caseSensitive")}
							aria-pressed={caseSensitive}
						>
							Aa
						</button>
					</Tooltip>
					<IconButton
						variant="ghost"
						aria-label={t("common.close")}
						onClick={handleClose}
					>
						<Xmark width={16} height={16} />
					</IconButton>
				</div>

				<div className={styles.inputRow}>
					<Input
						type="text"
						inputSize="sm"
						className={styles.replaceInput}
						placeholder={t("search.replacePlaceholder")}
						value={replaceText}
						onChange={(e) => setReplaceText(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					{searchResult && searchResult.totalMatches > 0 && replaceText && (
						<button
							type="button"
							className={styles.replaceAllButton}
							onClick={handleReplaceAll}
						>
							{t("search.replaceAll")}
						</button>
					)}
				</div>
			</div>

			{searchResult && (
				<div className={styles.summary}>
					{t("search.matchCount", { count: searchResult.totalMatches })}
				</div>
			)}

			<div className={styles.results}>
				{searchResult && searchResult.totalMatches === 0 && (
					<div className={styles.emptyState}>{t("search.noResults")}</div>
				)}

				{matches.map((match, index) => (
					<MatchItem
						key={`${match.sceneId}-${match.charOffset}`}
						match={match}
						isSelected={index === selectedIndex}
						onClick={() => handleMatchClick(match, index)}
					/>
				))}
			</div>
		</section>
	);
};

type MatchItemProps = {
	match: SearchMatch;
	isSelected: boolean;
	onClick: () => void;
};

const CONTEXT_CHARS = 8;

const MatchItem = ({ match, isSelected, onClick }: MatchItemProps) => {
	const { t } = useTranslation();
	const contextStart = Math.max(0, match.matchStart - CONTEXT_CHARS);
	const contextEnd = Math.min(
		match.lineText.length,
		match.matchEnd + CONTEXT_CHARS,
	);

	const prefix = contextStart > 0 ? "…" : "";
	const suffix = contextEnd < match.lineText.length ? "…" : "";

	const beforeMatch = match.lineText.substring(contextStart, match.matchStart);
	const matchText = match.lineText.substring(match.matchStart, match.matchEnd);
	const afterMatch = match.lineText.substring(match.matchEnd, contextEnd);

	return (
		<button
			type="button"
			className={styles.matchItem}
			data-selected={isSelected}
			onClick={onClick}
		>
			<span className={styles.sceneTitle}>
				{match.sceneTitle || t("search.untitledScene")}
			</span>
			<span className={styles.matchText}>
				{prefix}
				{beforeMatch}
				<span className={styles.matchHighlight}>{matchText}</span>
				{afterMatch}
				{suffix}
			</span>
		</button>
	);
};
