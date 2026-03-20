import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	clearSearchAtom,
	executeSearchAtom,
	type KnowledgeOutline,
	knowledgeListAtom,
	knowledgeTypesAtom,
	searchQueryAtom,
	searchResultsAtom,
	selectedTypeIdAtom,
	updateKnowledgeSortOrder,
} from "@features/knowledge/model";
import { useInlineInput } from "@shared/hooks/use-inline-input";
import { useDndSensors } from "@shared/lib/dnd";
import { IconButton } from "@shared/ui/icon-button";
import { Input } from "@shared/ui/input";
import { SearchInput } from "@shared/ui/search-input";
import { NodeDragOverlay } from "@shared/ui/sidebar-node";
import { Plus } from "iconoir-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SortableKnowledgeListItem } from "./knowledge-list-item";
import styles from "./styles.module.css";
import { useKnowledgeListLoader } from "./use-knowledge-list-loader";

type Props = {
	workId: string | null;
};

const buildSortableId = (id: string) => `knowledge-${id}`;
const parseSortableId = (sortableId: string): string | null => {
	const match = sortableId.match(/^knowledge-(.+)$/);
	return match ? match[1] : null;
};

const SEARCH_DEBOUNCE_MS = 300;

export const KnowledgeList = ({ workId }: Props) => {
	const { t } = useTranslation();
	const { knowledge, handleCreate } = useKnowledgeListLoader(workId);
	const selectedTypeId = useAtomValue(selectedTypeIdAtom);
	const types = useAtomValue(knowledgeTypesAtom);
	const fullList = useAtomValue(knowledgeListAtom);
	const setKnowledgeList = useSetAtom(knowledgeListAtom);

	const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
	const searchResults = useAtomValue(searchResultsAtom);
	const executeSearch = useSetAtom(executeSearchAtom);
	const clearSearch = useSetAtom(clearSearchAtom);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const matchedTextMap = useMemo(() => {
		if (!searchResults) return new Map<string, string>();
		return new Map(searchResults.map((r) => [r.id, r.matched_text]));
	}, [searchResults]);

	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (!workId || !searchQuery.trim()) {
			return;
		}

		searchTimeoutRef.current = setTimeout(() => {
			executeSearch({ workId, query: searchQuery });
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [workId, searchQuery, executeSearch]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value);
		},
		[setSearchQuery],
	);

	const handleClearSearch = useCallback(() => {
		clearSearch();
	}, [clearSearch]);

	const selectedTypeName = useMemo(() => {
		if (!types || selectedTypeId === null) return "";
		const type = types.find((t) => t.id === selectedTypeId);
		return type?.name ?? "";
	}, [types, selectedTypeId]);

	const { isAdding, inputProps, startAdd } = useInlineInput({
		onSubmit: handleCreate,
	});

	const [activeItem, setActiveItem] = useState<KnowledgeOutline | null>(null);
	const sensors = useDndSensors();

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			const id = parseSortableId(String(event.active.id));
			if (id === null || !fullList) return;
			const item = fullList.find((k) => k.id === id);
			if (item) setActiveItem(item);
		},
		[fullList],
	);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setActiveItem(null);

			const { active, over } = event;
			if (!over || active.id === over.id || !fullList) return;

			const activeId = parseSortableId(String(active.id));
			const overId = parseSortableId(String(over.id));
			if (activeId === null || overId === null) return;

			const oldIndex = fullList.findIndex((k) => k.id === activeId);
			const newIndex = fullList.findIndex((k) => k.id === overId);
			if (oldIndex === -1 || newIndex === -1) return;

			const newList = arrayMove(fullList, oldIndex, newIndex);
			setKnowledgeList(newList);

			for (let i = 0; i < newList.length; i++) {
				if (fullList[i]?.id !== newList[i].id) {
					await updateKnowledgeSortOrder(newList[i].id, i);
				}
			}
		},
		[fullList, setKnowledgeList],
	);

	const sortableIds = knowledge?.map((item) => buildSortableId(item.id)) ?? [];

	return (
		<section className={styles.root}>
			<header className={styles.header}>
				<div className={styles.headerTop}>
					<h2 className={styles.title}>
						{selectedTypeName || t("knowledge.all")}
					</h2>
					<div className={styles.actions}>
						<IconButton
							variant="ghost"
							onClick={startAdd}
							disabled={workId === null || isAdding}
							aria-label={t("knowledge.addNew")}
						>
							<Plus width={16} height={16} />
						</IconButton>
					</div>
				</div>
				<SearchInput
					value={searchQuery}
					onChange={handleSearchChange}
					onClear={handleClearSearch}
				/>
			</header>
			<div className={styles.body}>
				{knowledge !== null && knowledge.length === 0 && !isAdding ? (
					<div className={styles.empty}>{t("knowledge.noMaterials")}</div>
				) : null}
				{knowledge === null || (knowledge.length === 0 && !isAdding) ? null : (
					<DndContext
						sensors={sensors}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<SortableContext
							items={sortableIds}
							strategy={verticalListSortingStrategy}
						>
							<div className={styles.list}>
								{knowledge.map((item) => (
									<SortableKnowledgeListItem
										key={item.id}
										knowledge={item}
										sortableId={buildSortableId(item.id)}
										searchQuery={searchQuery.trim() || undefined}
										matchedText={matchedTextMap.get(item.id)}
									/>
								))}
								{isAdding && (
									<div className={styles.inlineInput}>
										<Input {...inputProps} />
									</div>
								)}
							</div>
						</SortableContext>
						<DragOverlay dropAnimation={null}>
							{activeItem && (
								<NodeDragOverlay
									title={activeItem.title || t("knowledge.untitled")}
								/>
							)}
						</DragOverlay>
					</DndContext>
				)}
			</div>
		</section>
	);
};
