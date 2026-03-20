import { isMacOS } from "@shared/lib/platform";
import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { useEffect } from "react";

export const useVerticalArrowKeys = (
	editor: Editor | null,
	isVertical: boolean,
) => {
	const enabled = isVertical && isMacOS();

	useEffect(() => {
		if (!editor || !enabled) return;

		let cleanup: (() => void) | undefined;

		const setup = () => {
			let dom: HTMLElement;
			try {
				dom = editor.view.dom;
			} catch {
				return;
			}

			const handleKeyDown = (e: KeyboardEvent) => {
				if (!ARROW_KEYS.has(e.key)) return;
				if (e.isComposing) return;

				e.preventDefault();
				e.stopPropagation();

				switch (e.key) {
					case "ArrowUp":
						moveInline(editor, -1, e.shiftKey);
						break;
					case "ArrowDown":
						moveInline(editor, 1, e.shiftKey);
						break;
					case "ArrowLeft":
						moveCrossColumn(editor, 1, e.shiftKey);
						break;
					case "ArrowRight":
						moveCrossColumn(editor, -1, e.shiftKey);
						break;
				}
			};

			dom.addEventListener("keydown", handleKeyDown, { capture: true });

			cleanup = () => {
				dom.removeEventListener("keydown", handleKeyDown, { capture: true });
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

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function moveInline(editor: Editor, direction: number, extend: boolean) {
	const { state, dispatch } = editor.view;
	const { from, to, $from, $to } = state.selection;

	if (!state.selection.empty && !extend) {
		const pos = direction < 0 ? from : to;
		dispatch(
			state.tr.setSelection(
				TextSelection.near(state.doc.resolve(pos), direction),
			),
		);
		return;
	}

	const current = direction < 0 ? $from : $to;
	const nextPos = current.pos + direction;

	if (nextPos < 0 || nextPos > state.doc.content.size) return;

	const $next = state.doc.resolve(nextPos);
	const selection = extend
		? TextSelection.create(state.doc, state.selection.$anchor.pos, nextPos)
		: TextSelection.near($next, direction);

	dispatch(state.tr.setSelection(selection).scrollIntoView());
}

function moveCrossColumn(editor: Editor, direction: number, extend: boolean) {
	const { view } = editor;
	const { state } = view;
	const pos = state.selection.from;
	const docSize = state.doc.content.size;

	let coords: { left: number; top: number; bottom: number };
	try {
		coords = view.coordsAtPos(pos);
	} catch {
		return;
	}

	const currentX = coords.left;
	const currentY = (coords.top + coords.bottom) / 2;

	const scanDir = direction;

	let enteredNewColumn = false;
	let newColumnX = 0;
	let bestPos = -1;
	let bestYDist = Number.POSITIVE_INFINITY;

	for (let i = 1; i <= 300; i++) {
		const cp = pos + scanDir * i;
		if (cp < 0 || cp > docSize) break;

		let cc: { left: number; top: number; bottom: number };
		try {
			cc = view.coordsAtPos(cp);
		} catch {
			continue;
		}

		if (!enteredNewColumn) {
			if (Math.abs(cc.left - currentX) > 10) {
				enteredNewColumn = true;
				newColumnX = cc.left;
			} else {
				continue;
			}
		}

		if (Math.abs(cc.left - newColumnX) > 10) break;

		const yDist = Math.abs((cc.top + cc.bottom) / 2 - currentY);
		if (yDist < bestYDist) {
			bestYDist = yDist;
			bestPos = cp;
		}
	}

	if (bestPos < 0) return;

	const selection = extend
		? TextSelection.create(state.doc, state.selection.$anchor.pos, bestPos)
		: TextSelection.near(state.doc.resolve(bestPos));

	view.dispatch(state.tr.setSelection(selection).scrollIntoView());
}
