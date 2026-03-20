import type {
	KnowledgeOutline,
	KnowledgeSearchResult,
	KnowledgeTypeOutline,
} from "@shared/types";
import { atom } from "jotai";
import {
	createKnowledge,
	deleteKnowledge,
	getKnowledgeByWork,
	getKnowledgeTypesByWork,
	searchKnowledge,
	updateKnowledgeTitle,
} from "./commands";

export const knowledgeListAtom = atom<KnowledgeOutline[] | null>(null);

export const knowledgeTypesAtom = atom<KnowledgeTypeOutline[] | null>(null);

export const selectedTypeIdAtom = atom<string | null>(null);

export const searchQueryAtom = atom("");

export const searchResultsAtom = atom<KnowledgeSearchResult[] | null>(null);

export const isSearchingAtom = atom(
	(get) => get(searchQueryAtom).trim() !== "",
);

export const typeCountsAtom = atom((get) => {
	const list = get(knowledgeListAtom);
	if (!list) return null;

	const counts: Record<string, number> = {};
	for (const item of list) {
		if (item.type_id) {
			counts[item.type_id] = (counts[item.type_id] ?? 0) + 1;
		}
	}
	return counts;
});

export const filteredKnowledgeListAtom = atom((get) => {
	const list = get(knowledgeListAtom);
	const selectedTypeId = get(selectedTypeIdAtom);
	const searchQuery = get(searchQueryAtom).toLowerCase().trim();
	const searchResults = get(searchResultsAtom);

	if (!list) return null;

	if (searchQuery && searchResults !== null) {
		const resultIds = new Set(searchResults.map((r) => r.id));
		let filtered = list.filter((item) => resultIds.has(item.id));

		if (selectedTypeId !== null) {
			filtered = filtered.filter((item) => item.type_id === selectedTypeId);
		}

		return filtered;
	}

	if (searchQuery) {
		let filtered = list.filter((item) =>
			item.title.toLowerCase().includes(searchQuery),
		);

		if (selectedTypeId !== null) {
			filtered = filtered.filter((item) => item.type_id === selectedTypeId);
		}

		return filtered;
	}

	if (selectedTypeId !== null) {
		return list.filter((item) => item.type_id === selectedTypeId);
	}

	return list;
});

export const editingKnowledgeIdAtom = atom<string | null>(null);

export const newlyCreatedKnowledgeIdAtom = atom<string | null>(null);

export const loadKnowledgeAtom = atom(
	null,
	async (_get, set, workId: string) => {
		const result = await getKnowledgeByWork(workId);
		if (result.ok) {
			set(knowledgeListAtom, result.value);
		}
		return result;
	},
);

export const loadKnowledgeTypesAtom = atom(
	null,
	async (_get, set, workId: string) => {
		const result = await getKnowledgeTypesByWork(workId);
		if (result.ok) {
			set(knowledgeTypesAtom, result.value);
		}
		return result;
	},
);

export const createKnowledgeAtom = atom(
	null,
	async (get, set, params: { title: string }) => {
		const { title } = params;
		const selectedTypeId = get(selectedTypeIdAtom);
		const types = get(knowledgeTypesAtom);

		let typeIdToUse = selectedTypeId;
		if (typeIdToUse === null && types) {
			const memoType =
				types.find((t) => t.name === "メモ" || t.name === "Memo") ?? types[0];
			typeIdToUse = memoType?.id ?? null;
		}

		if (typeIdToUse === null) {
			return {
				ok: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "No knowledge type available",
				},
			} as const;
		}

		const result = await createKnowledge(typeIdToUse, title);
		if (result.ok) {
			const newId = result.value;
			const currentList = get(knowledgeListAtom) ?? [];
			const newKnowledge: KnowledgeOutline = {
				id: newId,
				type_id: typeIdToUse,
				title,
				sort_order: currentList.length,
			};
			set(knowledgeListAtom, [...currentList, newKnowledge]);

			set(knowledgeTypesAtom, (prev) =>
				(prev ?? []).map((type) =>
					type.id === typeIdToUse ? { ...type, count: type.count + 1 } : type,
				),
			);

			set(newlyCreatedKnowledgeIdAtom, newId);
		}
		return result;
	},
);

export const deleteKnowledgeAtom = atom(
	null,
	async (get, set, knowledgeId: string) => {
		const currentList = get(knowledgeListAtom) ?? [];
		const targetKnowledge = currentList.find((n) => n.id === knowledgeId);
		const typeId = targetKnowledge?.type_id;

		const result = await deleteKnowledge(knowledgeId);
		if (result.ok) {
			set(knowledgeListAtom, (prev) =>
				(prev ?? []).filter((n) => n.id !== knowledgeId),
			);

			if (typeId !== null && typeId !== undefined) {
				set(knowledgeTypesAtom, (prev) =>
					(prev ?? []).map((type) =>
						type.id === typeId
							? { ...type, count: Math.max(0, type.count - 1) }
							: type,
					),
				);
			}
		}
		return result;
	},
);

export const updateKnowledgeInListAtom = atom(
	null,
	(get, set, update: { id: string; title?: string; type_id?: string }) => {
		const currentList = get(knowledgeListAtom) ?? [];
		const targetKnowledge = currentList.find((n) => n.id === update.id);
		const oldTypeId = targetKnowledge?.type_id;

		set(knowledgeListAtom, (prev) =>
			(prev ?? []).map((n) =>
				n.id === update.id
					? {
							...n,
							...(update.title !== undefined && { title: update.title }),
							...(update.type_id !== undefined && { type_id: update.type_id }),
						}
					: n,
			),
		);

		if (update.type_id !== undefined && oldTypeId !== update.type_id) {
			set(knowledgeTypesAtom, (prev) =>
				(prev ?? []).map((type) => {
					if (type.id === oldTypeId) {
						return { ...type, count: Math.max(0, type.count - 1) };
					}
					if (type.id === update.type_id) {
						return { ...type, count: type.count + 1 };
					}
					return type;
				}),
			);
		}
	},
);

export const updateKnowledgeTitleInListAtom = atom(
	null,
	async (_get, set, params: { knowledgeId: string; title: string }) => {
		const { knowledgeId, title } = params;
		const result = await updateKnowledgeTitle(knowledgeId, title);
		if (result.ok) {
			set(knowledgeListAtom, (prev) =>
				(prev ?? []).map((n) => (n.id === knowledgeId ? { ...n, title } : n)),
			);
		}
		return result;
	},
);

export const reloadKnowledgeTypesAtom = atom(
	null,
	async (_get, set, workId: string) => {
		const result = await getKnowledgeTypesByWork(workId);
		if (result.ok) {
			set(knowledgeTypesAtom, result.value);
		}
		return result;
	},
);

export const executeSearchAtom = atom(
	null,
	async (_get, set, params: { workId: string; query: string }) => {
		const { workId, query } = params;
		if (!query.trim()) {
			set(searchResultsAtom, null);
			return;
		}
		const result = await searchKnowledge(workId, query);
		if (result.ok) {
			set(searchResultsAtom, result.value);
		}
	},
);

export const clearSearchAtom = atom(null, (_get, set) => {
	set(searchQueryAtom, "");
	set(searchResultsAtom, null);
});

export const resetKnowledgeAtom = atom(null, (_get, set) => {
	set(knowledgeListAtom, null);
	set(knowledgeTypesAtom, null);
	set(selectedTypeIdAtom, null);
	set(searchQueryAtom, "");
	set(searchResultsAtom, null);
	set(editingKnowledgeIdAtom, null);
	set(newlyCreatedKnowledgeIdAtom, null);
});
