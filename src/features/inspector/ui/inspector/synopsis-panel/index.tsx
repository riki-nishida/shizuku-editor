import { updateSceneSynopsis } from "@features/write";
import { Textarea } from "@shared/ui/textarea";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SynopsisPanelProps = {
	sceneId: string;
	initialSynopsis: string;
};

export const SynopsisPanel = ({
	sceneId,
	initialSynopsis,
}: SynopsisPanelProps) => {
	const { t } = useTranslation();
	const [synopsis, setSynopsis] = useState(initialSynopsis);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSavedRef = useRef(initialSynopsis);
	const latestSynopsisRef = useRef(synopsis);
	latestSynopsisRef.current = synopsis;

	useEffect(() => {
		setSynopsis(initialSynopsis);
		lastSavedRef.current = initialSynopsis;
	}, [initialSynopsis]);

	const saveSynopsis = useCallback(
		async (value: string) => {
			if (value === lastSavedRef.current) return;

			const result = await updateSceneSynopsis(sceneId, value);
			if (result.ok) {
				lastSavedRef.current = value;
			}
		},
		[sceneId],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setSynopsis(value);

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			debounceRef.current = setTimeout(() => {
				saveSynopsis(value);
			}, 500);
		},
		[saveSynopsis],
	);

	const handleBlur = useCallback(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
		saveSynopsis(synopsis);
	}, [synopsis, saveSynopsis]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			const value = latestSynopsisRef.current;
			if (value !== lastSavedRef.current) {
				updateSceneSynopsis(sceneId, value);
			}
		};
	}, [sceneId]);

	return (
		<Textarea
			label={t("inspector.synopsis")}
			value={synopsis}
			onChange={handleChange}
			onBlur={handleBlur}
			rows={6}
		/>
	);
};
