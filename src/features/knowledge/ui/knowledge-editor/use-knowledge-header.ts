import {
	getKnowledge,
	type Knowledge,
	knowledgeListAtom,
	selectedTypeIdAtom,
	updateKnowledgeInListAtom,
	updateKnowledgeTitle,
	updateKnowledgeTypeId,
} from "@features/knowledge/model";
import { selectedNodeAtom } from "@features/work";
import { useToast } from "@shared/lib/toast";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Draft = {
	title: string;
	type_id: string;
};

const initialDraft: Draft = {
	title: "",
	type_id: "",
};

type UseKnowledgeHeaderOptions = {
	knowledgeId?: string;
};

export const useKnowledgeHeader = (options?: UseKnowledgeHeaderOptions) => {
	const { t } = useTranslation();
	const { showError } = useToast();
	const selectedNode = useAtomValue(selectedNodeAtom);
	const globalSelectedKnowledgeId =
		selectedNode?.type === "knowledge" ? selectedNode.id : null;
	const selectedKnowledgeId = options?.knowledgeId ?? globalSelectedKnowledgeId;
	const knowledgeList = useAtomValue(knowledgeListAtom);
	const updateKnowledgeInList = useSetAtom(updateKnowledgeInListAtom);
	const [selectedTypeId, setSelectedTypeId] = useAtom(selectedTypeIdAtom);

	const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
	const [draft, setDraft] = useState<Draft>(initialDraft);

	const updateDraft = useCallback(
		<K extends keyof Draft>(key: K, value: Draft[K]) => {
			setDraft((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	useEffect(() => {
		if (selectedKnowledgeId === null) {
			setKnowledge(null);
			setDraft(initialDraft);
			return;
		}

		const loadKnowledge = async () => {
			const result = await getKnowledge(selectedKnowledgeId);
			if (result.ok) {
				const data = result.value;
				setKnowledge(data);
				setDraft({
					title: data.title,
					type_id: data.type_id,
				});
			}
		};

		loadKnowledge();
	}, [selectedKnowledgeId]);

	useEffect(() => {
		if (!selectedKnowledgeId || !knowledgeList || !knowledge) return;
		const listItem = knowledgeList.find((k) => k.id === selectedKnowledgeId);
		if (listItem && listItem.title !== knowledge.title) {
			setKnowledge((prev) =>
				prev ? { ...prev, title: listItem.title } : null,
			);
		}
	}, [knowledgeList, selectedKnowledgeId, knowledge]);

	const handleTitleChange = useCallback(
		async (newTitle: string) => {
			if (!knowledge || newTitle === knowledge.title) return;

			try {
				await updateKnowledgeTitle(knowledge.id, newTitle);
				setKnowledge({ ...knowledge, title: newTitle });
				updateKnowledgeInList({ id: knowledge.id, title: newTitle });
			} catch {
				showError(t("knowledge.renameFailed"));
			}
		},
		[knowledge, updateKnowledgeInList, showError, t],
	);

	const handleTypeChange = useCallback(
		async (nextTypeId: string) => {
			if (!knowledge) return;
			const prevTypeId = draft.type_id;
			updateDraft("type_id", nextTypeId);
			try {
				await updateKnowledgeTypeId(knowledge.id, nextTypeId);
				setKnowledge((prev) =>
					prev ? { ...prev, type_id: nextTypeId } : prev,
				);
				updateKnowledgeInList({ id: knowledge.id, type_id: nextTypeId });

				if (selectedTypeId !== null && nextTypeId !== selectedTypeId) {
					setSelectedTypeId(nextTypeId);
				}
			} catch {
				showError(t("knowledge.categoryUpdateFailed"));
				updateDraft("type_id", prevTypeId);
			}
		},
		[
			knowledge,
			updateKnowledgeInList,
			updateDraft,
			draft.type_id,
			showError,
			selectedTypeId,
			setSelectedTypeId,
			t,
		],
	);

	return {
		knowledge,
		draft,
		handlers: {
			titleChange: handleTitleChange,
			typeChange: handleTypeChange,
		},
	};
};
