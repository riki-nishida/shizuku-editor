import { isMacOS } from "@shared/lib/platform";
import type { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";

export const useCustomCaret = (editor: Editor | null, isVertical: boolean) => {
	const caretRef = useRef<HTMLDivElement | null>(null);
	const rafRef = useRef<number>(0);

	const enabled = isVertical && isMacOS();

	useEffect(() => {
		if (!editor || !enabled) return;

		let cleanup: (() => void) | undefined;

		const setup = () => {
			let pmEl: HTMLElement;
			try {
				pmEl = editor.view.dom;
			} catch {
				return;
			}

			pmEl.style.caretColor = "transparent";

			const caret = document.createElement("div");
			caret.className = "custom-caret";
			Object.assign(caret.style, {
				position: "fixed",

				width: "1em",
				height: "2px",
				background: "var(--text-editor, #333)",
				pointerEvents: "none",
				zIndex: "9999",
				display: "none",
			});
			document.body.appendChild(caret);
			caretRef.current = caret;

			const blinkKeyframes = [
				{ opacity: 1 },
				{ opacity: 1, offset: 0.5 },
				{ opacity: 0, offset: 0.5001 },
				{ opacity: 0 },
			];
			const blinkAnimation = caret.animate(blinkKeyframes, {
				duration: 1000,
				iterations: Number.POSITIVE_INFINITY,
			});

			const updatePosition = () => {
				if (!caretRef.current) return;

				try {
					const { state } = editor.view;
					const focused = editor.isFocused;

					if (!focused || !state.selection.empty) {
						caretRef.current.style.display = "none";
						return;
					}

					const pos = state.selection.from;
					const coords = editor.view.coordsAtPos(pos);

					Object.assign(caretRef.current.style, {
						display: "block",
						left: `${coords.left}px`,
						top: `${coords.top}px`,
					});

					blinkAnimation.currentTime = 0;
				} catch {
					caretRef.current.style.display = "none";
				}
			};

			const onUpdate = () => {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = requestAnimationFrame(updatePosition);
			};

			const onBlur = () => {
				if (caretRef.current) {
					caretRef.current.style.display = "none";
				}
			};

			editor.on("selectionUpdate", onUpdate);
			editor.on("focus", onUpdate);
			editor.on("blur", onBlur);
			editor.on("transaction", onUpdate);

			onUpdate();

			cleanup = () => {
				cancelAnimationFrame(rafRef.current);
				editor.off("selectionUpdate", onUpdate);
				editor.off("focus", onUpdate);
				editor.off("blur", onBlur);
				editor.off("transaction", onUpdate);
				pmEl.style.caretColor = "";
				blinkAnimation.cancel();
				caretRef.current?.remove();
				caretRef.current = null;
			};
		};

		setup();
		if (!cleanup) {
			editor.on("create", setup);
		}

		return () => {
			editor.off("create", setup);
			cleanup?.();
		};
	}, [editor, enabled]);
};
