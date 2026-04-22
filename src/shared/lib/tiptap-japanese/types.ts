/**
 * Controls how markup (ruby, emphasis dots) is rendered in the editor.
 *
 * - `"wysiwyg"` — Renders the actual visual representation (e.g., `<ruby>` elements)
 * - `"notation"` — Shows markup using a simplified notation style
 */
export type MarkupDisplayMode = "wysiwyg" | "notation";

/**
 * Represents a content markup annotation stored alongside plain text.
 *
 * Offsets (`start`, `end`) are Unicode code point positions within the plain text string.
 */
export type ContentMarkup =
	| { type: "ruby"; start: number; end: number; ruby: string }
	| { type: "emphasis_dot"; start: number; end: number }
	| {
			type: "annotation";
			start: number;
			end: number;
			id: string;
			comment: string;
	  };
