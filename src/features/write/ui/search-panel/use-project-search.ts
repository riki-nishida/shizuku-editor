import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import { pendingSavesRegistry } from "@shared/hooks/pending-saves-registry";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { reloadSceneContentAtom } from "../../model/editor/store";
import { replaceInProject, searchProject } from "../../model/search/commands";
import {
	closeSearchPanelAtom,
	editorJumpTargetAtom,
	replaceTextAtom,
	searchCaseSensitiveAtom,
	searchPanelVisibleAtom,
	searchQueryAtom,
	searchResultAtom,
	selectedMatchIndexAtom,
} from "../../model/search/store";
import type { SearchMatch } from "../../model/search/types";

const SEARCH_DEBOUNCE_MS = 300;

export const useProjectSearch = () => {
	const { t } = useTranslation();
	const { showError, showSuccess } = useToast();
	const selectedWork = useAtomValue(selectedWorkAtom);
	const workId = selectedWork?.id ?? null;

	const [isVisible, setIsVisible] = useAtom(searchPanelVisibleAtom);
	const [query, setQuery] = useAtom(searchQueryAtom);
	const [caseSensitive, setCaseSensitive] = useAtom(searchCaseSensitiveAtom);
	const [replaceText, setReplaceText] = useAtom(replaceTextAtom);
	const setSearchResult = useSetAtom(searchResultAtom);
	const [selectedIndex, setSelectedIndex] = useAtom(selectedMatchIndexAtom);
	const searchResult = useAtomValue(searchResultAtom);
	const closeSearchPanel = useSetAtom(closeSearchPanelAtom);

	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const setEditorJumpTarget = useSetAtom(editorJumpTargetAtom);
	const reloadSceneContent = useSetAtom(reloadSceneContentAtom);

	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const executeSearch = useCallback(async () => {
		if (!workId || !query.trim()) {
			setSearchResult(null);
			return;
		}

		await pendingSavesRegistry.flushAll();

		const result = await searchProject(workId, query.trim(), caseSensitive);

		if (result.ok) {
			setSearchResult(result.value);
			setSelectedIndex(-1);
		} else {
			showError(t("search.searchFailed"));
			setSearchResult(null);
		}
	}, [
		workId,
		query,
		caseSensitive,
		setSearchResult,
		setSelectedIndex,
		showError,
		t,
	]);

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		if (!query.trim()) {
			setSearchResult(null);
			return;
		}

		debounceRef.current = setTimeout(() => {
			executeSearch();
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, executeSearch, setSearchResult]);

	const handleClose = useCallback(() => {
		closeSearchPanel();
		setQuery("");
		setReplaceText("");
		setSearchResult(null);
		setSelectedIndex(-1);
	}, [
		closeSearchPanel,
		setQuery,
		setReplaceText,
		setSearchResult,
		setSelectedIndex,
	]);

	const handleMatchClick = useCallback(
		(match: SearchMatch, index: number) => {
			setSelectedIndex(index);
			setSelectedNode({ id: match.sceneId, type: "scene" });

			setEditorJumpTarget({
				sceneId: match.sceneId,
				charOffset: match.charOffset,
				length: match.matchEnd - match.matchStart,
			});
		},
		[setSelectedIndex, setSelectedNode, setEditorJumpTarget],
	);

	const handleReplaceAll = useCallback(async () => {
		if (!workId || !query.trim() || !searchResult) {
			return;
		}

		const confirmed = await showConfirmDialog(
			t("search.replaceAllConfirm", {
				count: searchResult.totalMatches,
				text: replaceText,
			}),
			{ title: t("search.replaceAllTitle"), kind: "warning" },
		);
		if (!confirmed) {
			return;
		}

		await pendingSavesRegistry.flushAll();

		const result = await replaceInProject(
			workId,
			query.trim(),
			replaceText,
			caseSensitive,
		);

		if (result.ok) {
			showSuccess(
				t("search.replaceResult", {
					count: result.value.replacedCount,
					scenes: result.value.affectedScenes,
				}),
			);

			const affectedSceneIds = [
				...new Set(searchResult.matches.map((m) => m.sceneId)),
			];
			await Promise.all(affectedSceneIds.map((id) => reloadSceneContent(id)));

			setQuery("");
			setReplaceText("");
			setSearchResult(null);
			setSelectedIndex(-1);
		} else {
			showError(t("search.replaceFailed"));
		}
	}, [
		workId,
		query,
		replaceText,
		caseSensitive,
		searchResult,
		reloadSceneContent,
		setQuery,
		setReplaceText,
		setSearchResult,
		setSelectedIndex,
		showSuccess,
		showError,
		t,
	]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		},
		[handleClose],
	);

	return {
		isVisible,
		setIsVisible,
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
	};
};
