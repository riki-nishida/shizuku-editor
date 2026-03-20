import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface TypewriterModeOptions {
	enabled: boolean;
	scrollElement?: HTMLElement | (() => HTMLElement | null) | null;
	scrollThreshold: number;
}

const typewriterModePluginKey = new PluginKey("typewriterMode");

function isVerticalWritingMode(element: Element): boolean {
	const style = window.getComputedStyle(element);
	const writingMode = style.writingMode;
	return writingMode === "vertical-rl" || writingMode === "vertical-lr";
}

function resolveScrollElement(
	option: TypewriterModeOptions["scrollElement"],
	fallback: HTMLElement,
): HTMLElement | null {
	if (typeof option === "function") return option();
	if (option instanceof HTMLElement) return option;
	return fallback;
}

export const TypewriterMode = Extension.create<TypewriterModeOptions>({
	name: "typewriterMode",

	addOptions() {
		return {
			enabled: false,
			scrollElement: null,
			scrollThreshold: 10,
		};
	},

	addProseMirrorPlugins() {
		const { enabled, scrollElement, scrollThreshold } = this.options;

		return [
			new Plugin({
				key: typewriterModePluginKey,
				view() {
					return {
						update(view, prevState) {
							if (!enabled) return;

							if (prevState.selection.eq(view.state.selection)) return;

							const { from } = view.state.selection;
							const coords = view.coordsAtPos(from);

							if (!coords) return;

							const container = resolveScrollElement(
								scrollElement,
								view.dom.parentElement as HTMLElement,
							);
							if (!container) return;

							const rect = container.getBoundingClientRect();
							const isVertical = isVerticalWritingMode(container);

							if (isVertical) {
								const targetX = rect.left + rect.width / 2;
								const scrollDelta = coords.left - targetX;

								if (Math.abs(scrollDelta) > scrollThreshold) {
									container.scrollBy({
										left: scrollDelta,
										behavior: "smooth",
									});
								}
							} else {
								const targetY = rect.top + rect.height / 2;
								const scrollDelta = coords.top - targetY;

								if (Math.abs(scrollDelta) > scrollThreshold) {
									container.scrollBy({
										top: scrollDelta,
										behavior: "smooth",
									});
								}
							}
						},
					};
				},
			}),
		];
	},
});
