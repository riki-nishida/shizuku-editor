import {
	editorSettingsAtom,
	exportSettingsAtom,
} from "@features/settings/model";
import type {
	ExportPerFormat,
	PersistedExportSettings,
} from "@features/settings/model/types";
import i18n from "@shared/lib/i18n";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExportFormat, ExportSettings } from "../../model/export/types";

const createDefaultSettings = (autoIndent: boolean): ExportSettings => ({
	format: "txt",
	mode: "single-file",
	includeChapterTitles: true,
	includeSceneTitles: true,
	includeSeparators: true,
	rubyMode: "paren",
	pageSize: "a4",
	writingMode: i18n.language === "ja" ? "vertical" : "horizontal",
	author: "",
	autoIndent,
});

export const useExportSettings = (isOpen: boolean) => {
	const editorSettings = useAtomValue(editorSettingsAtom);
	const [persisted, setPersisted] = useAtom(exportSettingsAtom);
	const persistedRef = useRef<PersistedExportSettings>(persisted);
	persistedRef.current = persisted;

	const forceWritingMode =
		i18n.language !== "ja" ? ("horizontal" as const) : undefined;

	const [settings, setSettings] = useState<ExportSettings>(() => {
		const defaults = createDefaultSettings(editorSettings.autoIndent);
		const saved = persisted[defaults.format];
		return {
			...defaults,
			...saved,
			...(forceWritingMode && { writingMode: forceWritingMode }),
		} as ExportSettings;
	});

	useEffect(() => {
		if (isOpen) {
			setSettings((prev) => {
				const saved = persistedRef.current[prev.format];
				return {
					...prev,
					...saved,
					autoIndent: editorSettings.autoIndent,
					...(forceWritingMode && { writingMode: forceWritingMode }),
				} as ExportSettings;
			});
		}
	}, [isOpen, editorSettings.autoIndent, forceWritingMode]);

	const savePersisted = useCallback(
		(updated: PersistedExportSettings) => {
			setPersisted(updated);
		},
		[setPersisted],
	);

	const updateSetting = useCallback(
		<K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
			setSettings((prev) => {
				const next = { ...prev, [key]: value };

				if (key === "format") {
					const updated = {
						...persistedRef.current,
						[prev.format]: extractFormatSettings(prev),
					};
					savePersisted(updated);

					const newFormat = value as ExportFormat;
					const saved = updated[newFormat] ?? {};
					return { ...prev, ...saved, format: newFormat } as ExportSettings;
				}

				const updated = {
					...persistedRef.current,
					[next.format]: extractFormatSettings(next),
				};
				savePersisted(updated);

				return next;
			});
		},
		[savePersisted],
	);

	const resetSettings = useCallback(() => {
		setSettings(createDefaultSettings(editorSettings.autoIndent));
	}, [editorSettings.autoIndent]);

	return {
		settings,
		updateSetting,
		resetSettings,
	};
};

function extractFormatSettings(settings: ExportSettings): ExportPerFormat {
	switch (settings.format) {
		case "txt":
			return { rubyMode: settings.rubyMode, mode: settings.mode };
		case "pdf":
			return { pageSize: settings.pageSize };
		case "epub":
			return { author: settings.author };
		default:
			return {};
	}
}
