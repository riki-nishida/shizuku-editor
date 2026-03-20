import { mergeAttributes, Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

export interface SceneSeparatorOptions {
	HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		sceneSeparator: {
			insertSceneSeparator: (attrs: {
				sceneId: string;
				sceneTitle: string;
			}) => ReturnType;
		};
	}
}

export const SceneSeparator = Node.create<SceneSeparatorOptions>({
	name: "sceneSeparator",

	group: "block",

	selectable: false,
	draggable: false,
	atom: true,

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	addAttributes() {
		return {
			sceneId: {
				default: "",
				parseHTML: (element: HTMLElement) =>
					element.getAttribute("data-scene-id"),
				renderHTML: (attributes: { sceneId?: string }) => ({
					"data-scene-id": attributes.sceneId,
				}),
			},
			sceneTitle: {
				default: "",
				parseHTML: (element: HTMLElement) =>
					element.getAttribute("data-scene-title"),
				renderHTML: (attributes: { sceneTitle?: string }) => ({
					"data-scene-title": attributes.sceneTitle,
				}),
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'div[data-type="scene-separator"]',
			},
		];
	},

	renderHTML({
		HTMLAttributes,
	}: {
		HTMLAttributes: Record<string, unknown>;
	}): DOMOutputSpec {
		const title = HTMLAttributes["data-scene-title"] as string;

		return [
			"div",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				"data-type": "scene-separator",
				class: "scene-separator",
				contenteditable: "false",
			}),
			[
				"div",
				{ class: "scene-separator-line" },
				["span", { class: "scene-separator-title" }, title],
			],
		];
	},

	addCommands() {
		return {
			insertSceneSeparator:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs,
					});
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			Backspace: ({ editor }) => {
				const { selection } = editor.state;
				const { $from } = selection;

				const nodeBefore = $from.nodeBefore;
				if (nodeBefore?.type.name === this.name) {
					return true;
				}

				return false;
			},
			Delete: ({ editor }) => {
				const { selection } = editor.state;
				const { $from } = selection;

				const nodeAfter = $from.nodeAfter;
				if (nodeAfter?.type.name === this.name) {
					return true;
				}

				return false;
			},
		};
	},
});
