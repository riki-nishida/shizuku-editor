import { type Knowledge, updateKnowledgeBody } from "@features/knowledge/model";
import { useAutoSave } from "@shared/hooks/use-auto-save";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EditorContent } from "./use-tiptap-editor";

export const useBodyEditor = (knowledge: Knowledge) => {
	const { t } = useTranslation();
	const [draftBody, setDraftBody] = useState(knowledge.body || "");
	const plainTextRef = useRef(knowledge.plain_text || "");

	useEffect(() => {
		setDraftBody(knowledge.body || "");
		plainTextRef.current = knowledge.plain_text || "";
	}, [knowledge.body, knowledge.plain_text]);

	const handleSaveToBackend = useCallback(
		async (value: string) => {
			const result = await updateKnowledgeBody(
				knowledge.id,
				value,
				plainTextRef.current,
			);
			if (!result.ok) {
				throw new Error(t("common.saveFailed"));
			}
		},
		[knowledge.id, t],
	);

	const { handleSave } = useAutoSave({
		value: draftBody,
		itemId: knowledge.id,
		onSave: handleSaveToBackend,
	});

	const handleBodyChange = useCallback((content: EditorContent) => {
		setDraftBody(content.html);
		plainTextRef.current = content.plainText;
	}, []);

	return {
		draftBody,
		handleBodyChange,
		handleSave,
	};
};
