import { createWork } from "@features/work/model/commands";
import { loadWorksAtom } from "@features/work/model/store";
import { useToast } from "@shared/lib/toast";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export const useCreateWork = () => {
	const { t } = useTranslation();
	const loadWorks = useSetAtom(loadWorksAtom);
	const { showSuccess, showError } = useToast();

	const handleCreateWork = useCallback(
		async (name: string): Promise<string | null> => {
			const result = await createWork(name);
			if (result.ok) {
				showSuccess(t("work.created"));
				await loadWorks();
				return result.value;
			}
			showError(t("work.createFailed"));
			return null;
		},
		[loadWorks, showSuccess, showError, t],
	);

	return { handleCreateWork };
};
