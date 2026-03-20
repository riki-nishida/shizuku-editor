import type { KeyboardEvent } from "react";
import { useCallback, useRef } from "react";

type UseIMESafeEnterOptions = {
	onEnter: () => void;
	onEscape?: () => void;
};

export const useIMESafeEnter = ({
	onEnter,
	onEscape,
}: UseIMESafeEnterOptions) => {
	const isComposingRef = useRef(false);
	const skipNextEnterRef = useRef(false);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onEscape?.();
				return;
			}

			if (event.key === "Process") return;
			if (event.key !== "Enter") return;

			if (isComposingRef.current || event.nativeEvent.isComposing) return;

			if (skipNextEnterRef.current) {
				skipNextEnterRef.current = false;
				return;
			}

			event.preventDefault();
			onEnter();
		},
		[onEnter, onEscape],
	);

	const handleCompositionStart = useCallback(() => {
		isComposingRef.current = true;
	}, []);

	const handleCompositionEnd = useCallback(() => {
		isComposingRef.current = false;
		skipNextEnterRef.current = true;

		setTimeout(() => {
			skipNextEnterRef.current = false;
		}, 100);
	}, []);

	return {
		handleKeyDown,
		handleCompositionStart,
		handleCompositionEnd,
	};
};
