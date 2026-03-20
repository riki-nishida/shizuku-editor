import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import {
	replaceTermAtom,
	searchCaseSensitiveAtom,
	searchTermAtom,
} from "@shared/store";
import { Input } from "@shared/ui/input";
import { Tooltip } from "@shared/ui/tooltip/tooltip";
import type { Editor } from "@tiptap/react";
import { NavArrowDown, NavArrowUp, Xmark } from "iconoir-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type SearchPanelProps = {
	editor: Editor | null;
	isOpen: boolean;
	onClose: () => void;
	focusKey?: number;
	initialSearchTerm?: string;
	isVertical?: boolean;
};

export const SearchPanel = ({
	editor,
	isOpen,
	onClose,
	focusKey,
	initialSearchTerm,
	isVertical = false,
}: SearchPanelProps) => {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
	const [replaceTerm, setReplaceTerm] = useAtom(replaceTermAtom);
	const [caseSensitive, setCaseSensitive] = useAtom(searchCaseSensitiveAtom);
	const [showReplace, setShowReplace] = useState(false);
	const { showSuccess } = useToast();
	const isComposingRef = useRef(false);
	const skipNextEnterRef = useRef(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const [, setTransactionTick] = useState(0);
	useEffect(() => {
		if (!editor || !isOpen) return;
		const handler = () => setTransactionTick((c) => c + 1);
		editor.on("transaction", handler);
		return () => {
			editor.off("transaction", handler);
		};
	}, [editor, isOpen]);

	useEffect(() => {
		if (isOpen && focusKey !== undefined && focusKey > 0) {
			if (initialSearchTerm) {
				setSearchTerm(initialSearchTerm);
			}
			searchInputRef.current?.focus();
			searchInputRef.current?.select();
		}
	}, [isOpen, focusKey, initialSearchTerm, setSearchTerm]);

	const results = editor?.storage.searchAndReplace?.results || [];
	const currentIndex = editor?.storage.searchAndReplace?.currentIndex ?? -1;
	const resultsCount = results.length;

	useEffect(() => {
		if (editor && isOpen) {
			editor.commands.setSearchTerm(searchTerm);
		}
	}, [editor, searchTerm, isOpen]);

	useEffect(() => {
		if (editor && isOpen && resultsCount > 0 && currentIndex < 0) {
			editor.commands.nextSearchResult();
		}
	}, [editor, isOpen, resultsCount, currentIndex]);

	useEffect(() => {
		if (editor && isOpen) {
			editor.commands.setReplaceTerm(replaceTerm);
		}
	}, [editor, replaceTerm, isOpen]);

	useEffect(() => {
		if (editor && isOpen) {
			editor.commands.setCaseSensitive(caseSensitive);
		}
	}, [editor, caseSensitive, isOpen]);

	const handleNext = useCallback(() => {
		editor?.commands.nextSearchResult();
	}, [editor]);

	const handlePrevious = useCallback(() => {
		editor?.commands.previousSearchResult();
	}, [editor]);

	const handleReplace = useCallback(() => {
		editor?.commands.replace();
	}, [editor]);

	const handleReplaceAll = useCallback(async () => {
		if (!editor || resultsCount === 0) return;
		const confirmed = await showConfirmDialog(
			t("search.replaceAllConfirm", { count: resultsCount, text: replaceTerm }),
			{ title: t("search.replaceAllTitle"), kind: "warning" },
		);
		if (!confirmed) return;
		editor.commands.replaceAll();
		showSuccess(t("search.replacedCount", { count: resultsCount }));
	}, [editor, resultsCount, replaceTerm, showSuccess, t]);

	const handleClose = useCallback(() => {
		editor?.commands.setSearchTerm("");
		onClose();
	}, [editor, onClose]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
				return;
			}

			if (e.key === "Process") return;
			if (e.key !== "Enter") return;

			if (isComposingRef.current || e.nativeEvent.isComposing) return;

			if (skipNextEnterRef.current) {
				skipNextEnterRef.current = false;
				return;
			}

			e.preventDefault();
			if (e.shiftKey) {
				handlePrevious();
			} else {
				handleNext();
			}
		},
		[handleClose, handleNext, handlePrevious],
	);

	const handleCompositionStart = useCallback(() => {
		isComposingRef.current = true;
	}, []);

	const handleCompositionEnd = useCallback(() => {
		isComposingRef.current = false;
		skipNextEnterRef.current = true;
	}, []);

	if (!isOpen) return null;

	return (
		<div
			className={`${styles.searchPanel} ${isVertical ? styles.verticalSearchPanel : ""}`}
		>
			<div className={styles.searchRow}>
				<Tooltip content={t("search.replace")}>
					<button
						type="button"
						className={styles.toggleButton}
						onClick={() => setShowReplace(!showReplace)}
						aria-label={t("search.toggleReplace")}
					>
						{showReplace ? (
							<NavArrowUp width={16} height={16} />
						) : (
							<NavArrowDown width={16} height={16} />
						)}
					</button>
				</Tooltip>
				<Input
					ref={searchInputRef}
					className={styles.searchInput}
					inputSize="sm"
					placeholder={t("search.placeholder")}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					onKeyDown={handleKeyDown}
					onCompositionStart={handleCompositionStart}
					onCompositionEnd={handleCompositionEnd}
					autoFocus
				/>
				<div className={styles.resultsCount}>
					{resultsCount > 0 && (
						<span>
							{currentIndex + 1} / {resultsCount}
						</span>
					)}
				</div>
				<Tooltip content={t("search.prevMatch")}>
					<button
						type="button"
						className={styles.navButton}
						onClick={handlePrevious}
						disabled={resultsCount === 0}
						aria-label={t("search.prevMatchShort")}
					>
						<NavArrowUp width={16} height={16} />
					</button>
				</Tooltip>
				<Tooltip content={t("search.nextMatch")}>
					<button
						type="button"
						className={styles.navButton}
						onClick={handleNext}
						disabled={resultsCount === 0}
						aria-label={t("search.nextMatchShort")}
					>
						<NavArrowDown width={16} height={16} />
					</button>
				</Tooltip>
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
				<Tooltip content={t("search.closeSearch")}>
					<button
						type="button"
						className={styles.closeButton}
						onClick={handleClose}
						aria-label={t("common.close")}
					>
						<Xmark width={16} height={16} />
					</button>
				</Tooltip>
			</div>

			{showReplace && (
				<div className={styles.replaceRow}>
					<div className={styles.toggleSpacer} />
					<Input
						className={styles.searchInput}
						inputSize="sm"
						placeholder={t("search.replacePlaceholder")}
						value={replaceTerm}
						onChange={(e) => setReplaceTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
					/>
					<button
						type="button"
						className={styles.replaceButton}
						onClick={handleReplace}
						disabled={resultsCount === 0 || currentIndex < 0}
					>
						{t("search.replace")}
					</button>
					<button
						type="button"
						className={styles.replaceButton}
						onClick={handleReplaceAll}
						disabled={resultsCount === 0}
					>
						{t("search.replaceAll")}
					</button>
				</div>
			)}
		</div>
	);
};
