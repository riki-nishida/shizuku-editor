import { Mark, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * Options for the {@link Annotation} mark extension.
 */
export interface AnnotationOptions {
	/** Additional HTML attributes to add to the rendered element. */
	HTMLAttributes: Record<string, unknown>;
	/** CSS class applied to annotation marks. Default: `"annotation-mark"`. */
	annotationClass: string;
}

/**
 * Inline annotation mark that attaches an ID and comment to a text range.
 *
 * Useful for editorial notes, review comments, or any metadata
 * that should be associated with a specific span of text.
 *
 * @example
 * ```ts
 * Annotation.configure({ annotationClass: "my-annotation" })
 *
 * editor.commands.setAnnotation({ id: "note-1", comment: "Check this" });
 * editor.commands.updateAnnotationComment("note-1", "Updated comment");
 * editor.commands.removeAnnotationById("note-1");
 * ```
 */
export const Annotation = Mark.create<AnnotationOptions>({
	name: "annotation",

	inclusive: false,
	exitable: true,

	addOptions() {
		return {
			HTMLAttributes: {},
			annotationClass: "annotation-mark",
		};
	},

	addAttributes() {
		return {
			id: {
				default: null,
				parseHTML: (element) => element.getAttribute("data-annotation-id"),
				renderHTML: (attributes) => {
					if (!attributes.id) return {};
					return { "data-annotation-id": attributes.id };
				},
			},
			comment: {
				default: "",
				parseHTML: (element) =>
					element.getAttribute("data-annotation-comment") || "",
				renderHTML: (attributes) => {
					return { "data-annotation-comment": attributes.comment ?? "" };
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "span[data-annotation-id]",
			},
		];
	},

	renderHTML({
		HTMLAttributes,
	}: {
		HTMLAttributes: Record<string, unknown>;
	}): DOMOutputSpec {
		return [
			"span",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: this.options.annotationClass,
			}),
			0,
		];
	},

	addCommands() {
		return {
			setAnnotation:
				(attributes: { id: string; comment: string }) =>
				({ commands }) => {
					return commands.setMark(this.name, attributes);
				},
			updateAnnotationComment:
				(id: string, comment: string) =>
				({ tr, state }) => {
					const { doc } = state;
					let updated = false;

					doc.descendants((node, pos) => {
						if (node.isText && node.marks.length > 0) {
							for (const mark of node.marks) {
								if (mark.type.name === this.name && mark.attrs.id === id) {
									const from = pos;
									const to = pos + node.nodeSize;
									const newMark = this.type.create({
										...mark.attrs,
										comment,
									});
									tr.removeMark(from, to, mark);
									tr.addMark(from, to, newMark);
									updated = true;
								}
							}
						}
					});

					return updated;
				},
			unsetAnnotation:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
			removeAnnotationById:
				(id: string) =>
				({ tr, state }) => {
					const { doc } = state;
					let removed = false;

					doc.descendants((node, pos) => {
						if (node.isText && node.marks.length > 0) {
							for (const mark of node.marks) {
								if (mark.type.name === this.name && mark.attrs.id === id) {
									const from = pos;
									const to = pos + node.nodeSize;
									tr.removeMark(from, to, mark);
									removed = true;
								}
							}
						}
					});

					return removed;
				},
		};
	},
});

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		annotation: {
			/** Apply an annotation with the given ID and comment to the selected text. */
			setAnnotation: (attributes: {
				id: string;
				comment: string;
			}) => ReturnType;
			/** Update the comment of an existing annotation by ID. */
			updateAnnotationComment: (id: string, comment: string) => ReturnType;
			/** Remove the annotation mark from the current selection. */
			unsetAnnotation: () => ReturnType;
			/** Remove all annotation marks with the given ID from the document. */
			removeAnnotationById: (id: string) => ReturnType;
		};
	}
}
