import { useCallback, useEffect, useRef, useState } from "react";
import { useIMESafeEnter } from "./use-ime-safe-enter";

type UseInlineInputOptions<T> = {
	onSubmit: (value: string) => Promise<T>;
	onCancel?: () => void;
	onSuccess?: (result: T) => void;
};

export const useInlineInput = <T>({
	onSubmit,
	onCancel,
	onSuccess,
}: UseInlineInputOptions<T>) => {
	const [isAdding, setIsAdding] = useState(false);
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const isSubmittingRef = useRef(false);

	useEffect(() => {
		if (isAdding && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isAdding]);

	const startAdd = useCallback(() => {
		setValue("");
		setIsAdding(true);
	}, []);

	const handleSubmit = useCallback(async () => {
		if (isSubmittingRef.current) return;

		const trimmedValue = value.trim();
		if (!trimmedValue) {
			setIsAdding(false);
			onCancel?.();
			return;
		}

		isSubmittingRef.current = true;
		try {
			const result = await onSubmit(trimmedValue);
			setIsAdding(false);
			setValue("");
			onSuccess?.(result);
		} finally {
			isSubmittingRef.current = false;
		}
	}, [value, onSubmit, onCancel, onSuccess]);

	const handleCancel = useCallback(() => {
		setIsAdding(false);
		setValue("");
		onCancel?.();
	}, [onCancel]);

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
		inputSize: "sm" as const,
	};

	return {
		isAdding,
		value,
		inputRef,
		inputProps,
		startAdd,
		handleCancel,
	};
};
