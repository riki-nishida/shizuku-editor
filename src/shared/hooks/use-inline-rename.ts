import { useCallback, useEffect, useRef, useState } from "react";
import { useIMESafeEnter } from "./use-ime-safe-enter";

type UseInlineRenameOptions = {
	initialValue: string;
	isEditing: boolean;
	onSubmit: (value: string) => Promise<void>;
	onCancel: () => void;
};

export const useInlineRename = ({
	initialValue,
	isEditing,
	onSubmit,
	onCancel,
}: UseInlineRenameOptions) => {
	const [value, setValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const hasSubmittedRef = useRef(false);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSubmit = useCallback(async () => {
		if (hasSubmittedRef.current) return;
		hasSubmittedRef.current = true;

		const trimmed = value.trim();
		if (trimmed !== initialValue) {
			await onSubmit(trimmed);
		} else {
			onCancel();
		}
		hasSubmittedRef.current = false;
	}, [value, initialValue, onSubmit, onCancel]);

	const handleCancel = useCallback(() => {
		setValue(initialValue);
		onCancel();
	}, [initialValue, onCancel]);

	const handleBlur = useCallback(() => {
		void handleSubmit();
	}, [handleSubmit]);

	const { handleKeyDown, handleCompositionStart, handleCompositionEnd } =
		useIMESafeEnter({
			onEnter: () => void handleSubmit(),
			onEscape: handleCancel,
		});

	const inputProps = {
		ref: inputRef,
		type: "text" as const,
		value,
		onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
			setValue(e.target.value),
		onKeyDown: handleKeyDown,
		onBlur: handleBlur,
		onCompositionStart: handleCompositionStart,
		onCompositionEnd: handleCompositionEnd,
	};

	return {
		value,
		inputRef,
		inputProps,
	};
};
