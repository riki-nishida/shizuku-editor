import { useToast } from "@shared/lib/toast";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { pendingSavesRegistry } from "./pending-saves-registry";

const AUTO_SAVE_DELAY_MS = 2000;

type UseAutoSaveParams<T> = {
	value: T;
	itemId: string | number;
	onSave: (value: T) => Promise<void>;
	isEqual?: (a: T, b: T) => boolean;
};

const defaultIsEqual = <T>(a: T, b: T): boolean => a === b;

export const useAutoSave = <T>({
	value,
	itemId,
	onSave,
	isEqual = defaultIsEqual,
}: UseAutoSaveParams<T>) => {
	const { t } = useTranslation();
	const { showError } = useToast();
	const lastSavedValueRef = useRef(value);
	const pendingValueRef = useRef(value);
	const onSaveRef = useRef(onSave);
	const isEqualRef = useRef(isEqual);
	const prevItemIdRef = useRef(itemId);

	isEqualRef.current = isEqual;

	const executeSave = useCallback(
		async (valueToSave: T) => {
			if (isEqualRef.current(valueToSave, lastSavedValueRef.current)) return;

			try {
				await onSaveRef.current(valueToSave);
				lastSavedValueRef.current = valueToSave;
			} catch {
				showError(t("common.saveFailed"));
			}
		},
		[showError, t],
	);

	useEffect(() => {
		const flush = async (): Promise<boolean> => {
			if (
				!isEqualRef.current(pendingValueRef.current, lastSavedValueRef.current)
			) {
				try {
					await onSaveRef.current(pendingValueRef.current);
					lastSavedValueRef.current = pendingValueRef.current;
					return true;
				} catch {
					showError(t("common.saveFailed"));
					return false;
				}
			}
			return false;
		};
		pendingSavesRegistry.register(flush);

		return () => {
			pendingSavesRegistry.unregister(flush);
		};
	}, [showError, t]);

	useEffect(() => {
		if (prevItemIdRef.current !== itemId) {
			if (
				!isEqualRef.current(pendingValueRef.current, lastSavedValueRef.current)
			) {
				void onSaveRef.current(pendingValueRef.current).catch(() => {
					showError(t("common.saveFailed"));
				});
			}
			lastSavedValueRef.current = value;
		}
		prevItemIdRef.current = itemId;
		pendingValueRef.current = value;
		onSaveRef.current = onSave;
	}, [itemId, value, onSave, showError, t]);

	useEffect(() => {
		const timer = setTimeout(() => {
			executeSave(value);
		}, AUTO_SAVE_DELAY_MS);

		return () => clearTimeout(timer);
	}, [value, executeSave]);

	useEffect(() => {
		return () => {
			if (
				!isEqualRef.current(pendingValueRef.current, lastSavedValueRef.current)
			) {
				void onSaveRef.current(pendingValueRef.current).catch(() => {
					showError(t("common.saveFailed"));
				});
			}
		};
	}, [showError, t]);

	const handleSave = useCallback(
		() => executeSave(value),
		[value, executeSave],
	);

	return { handleSave };
};
