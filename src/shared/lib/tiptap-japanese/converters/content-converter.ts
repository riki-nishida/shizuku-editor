import type { ContentMarkup } from "../types";

/**
 * Counts the number of Unicode code points in a string.
 *
 * Unlike `String.length` (which counts UTF-16 code units), this correctly
 * handles characters outside the Basic Multilingual Plane (e.g. emoji).
 */
const codePointLength = (str: string): number => {
	let count = 0;
	for (const _ of str) {
		count++;
	}
	return count;
};

/**
 * Parses an HTML string into plain text and an array of content markups.
 *
 * Markup offsets (`start`, `end`) are measured in Unicode code points,
 * not UTF-16 code units.
 *
 * Supports `<ruby>`, `<span data-ruby>`, `<span data-emphasis-dot>`,
 * and `<span data-annotation-id>` elements.
 *
 * @param html - The HTML string to parse
 * @returns An object containing the extracted `text` and `markups`
 *
 * @example
 * ```ts
 * const { text, markups } = htmlToContent(
 *   '<p>今日は<span data-ruby="てんき">天気</span>がいい</p>'
 * );
 * // text: "今日は天気がいい"
 * // markups: [{ type: "ruby", start: 3, end: 5, ruby: "てんき" }]
 * ```
 */
export const htmlToContent = (
	html: string,
): {
	text: string;
	markups: ContentMarkup[];
} => {
	if (!html || html === "<p></p>") {
		return { text: "", markups: [] };
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const body = doc.body;

	const markups: ContentMarkup[] = [];
	let text = "";
	let charOffset = 0;

	const processNode = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const nodeText = node.textContent || "";
			text += nodeText;
			charOffset += codePointLength(nodeText);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as HTMLElement;
			const tagName = element.tagName.toLowerCase();

			if (tagName === "br") {
				text += "\n";
				charOffset += 1;
				return;
			}

			if (tagName === "p" || tagName === "div") {
				if (text.length > 0) {
					text += "\n";
					charOffset += 1;
				}
				for (const child of element.childNodes) {
					processNode(child);
				}
				return;
			}

			if (tagName === "ruby") {
				const rt = element.querySelector("rt");
				const rubyText = rt?.textContent || "";
				const start = charOffset;
				const rb = element.querySelector("rb");
				if (rb) {
					for (const child of rb.childNodes) {
						processNode(child);
					}
				} else {
					for (const child of element.childNodes) {
						if (
							child.nodeType === Node.ELEMENT_NODE &&
							(child as HTMLElement).tagName.toLowerCase() === "rt"
						) {
							continue;
						}
						processNode(child);
					}
				}
				const end = charOffset;
				if (rubyText) {
					markups.push({
						type: "ruby",
						start,
						end,
						ruby: rubyText,
					});
				}
				return;
			}

			if (tagName === "span") {
				const rubyText = element.getAttribute("data-ruby");
				const hasEmphasisDot =
					element.getAttribute("data-emphasis-dot") === "true";
				const annotationId = element.getAttribute("data-annotation-id");
				const annotationComment = element.getAttribute(
					"data-annotation-comment",
				);

				if (rubyText) {
					const start = charOffset;
					for (const child of element.childNodes) {
						processNode(child);
					}
					const end = charOffset;
					markups.push({
						type: "ruby",
						start,
						end,
						ruby: rubyText,
					});
					return;
				}

				if (hasEmphasisDot) {
					const start = charOffset;
					for (const child of element.childNodes) {
						processNode(child);
					}
					const end = charOffset;
					markups.push({
						type: "emphasis_dot",
						start,
						end,
					});
					return;
				}

				if (annotationId && annotationComment !== null) {
					const start = charOffset;
					for (const child of element.childNodes) {
						processNode(child);
					}
					const end = charOffset;
					markups.push({
						type: "annotation",
						start,
						end,
						id: annotationId,
						comment: annotationComment || "",
					});
					return;
				}
			}

			for (const child of element.childNodes) {
				processNode(child);
			}
		}
	};

	for (const child of body.childNodes) {
		processNode(child);
	}

	markups.sort((a, b) => a.start - b.start);

	return { text, markups };
};

/**
 * Converts plain text and content markups back into an HTML string.
 *
 * When markups overlap, earlier markups (by position) are kept and
 * later overlapping ones are discarded.
 *
 * @param text - The plain text content
 * @param markups - Array of markup annotations to apply
 * @returns An HTML string with `<p>` tags for paragraphs and markup spans
 *
 * @example
 * ```ts
 * const html = contentToHtml("今日は天気がいい", [
 *   { type: "ruby", start: 3, end: 5, ruby: "てんき" },
 * ]);
 * // '<p>今日は<span data-ruby="てんき">天気</span>がいい</p>'
 * ```
 */
export const contentToHtml = (
	text: string,
	markups: ContentMarkup[],
): string => {
	if (!text) {
		return "<p></p>";
	}

	const sortedMarkups = [...markups].sort((a, b) => b.start - a.start);

	const filteredMarkups: ContentMarkup[] = [];
	let nextSafeEnd = Number.MAX_SAFE_INTEGER;
	for (const markup of sortedMarkups) {
		if (markup.end <= nextSafeEnd) {
			filteredMarkups.push(markup);
			nextSafeEnd = markup.start;
		}
	}

	const chars = [...text];

	for (const markup of filteredMarkups) {
		const baseText = chars.slice(markup.start, markup.end).join("");

		let replacement: string;
		if (markup.type === "ruby") {
			replacement = `<span data-ruby="${escapeHtml(markup.ruby)}">${escapeHtml(baseText)}</span>`;
		} else if (markup.type === "emphasis_dot") {
			replacement = `<span data-emphasis-dot="true">${escapeHtml(baseText)}</span>`;
		} else if (markup.type === "annotation") {
			replacement = `<span data-annotation-id="${escapeHtml(markup.id)}" data-annotation-comment="${escapeHtml(markup.comment)}">${escapeHtml(baseText)}</span>`;
		} else {
			continue;
		}

		chars.splice(markup.start, markup.end - markup.start, replacement);
	}

	const result = chars.join("");
	const paragraphs = result.split("\n");

	return paragraphs.map((p) => `<p>${p || ""}</p>`).join("");
};

const escapeHtml = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

/**
 * Serializes a markup array to a JSON string for storage.
 *
 * @param markups - The markup array to serialize
 * @returns A JSON string representation
 */
export const serializeMarkups = (markups: ContentMarkup[]): string =>
	JSON.stringify(markups);

const VALID_MARKUP_TYPES = new Set(["ruby", "emphasis_dot", "annotation"]);

const isValidMarkup = (value: unknown): value is ContentMarkup => {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	if (
		typeof obj.type !== "string" ||
		!VALID_MARKUP_TYPES.has(obj.type) ||
		typeof obj.start !== "number" ||
		typeof obj.end !== "number"
	) {
		return false;
	}
	if (obj.type === "ruby" && typeof obj.ruby !== "string") {
		return false;
	}
	if (
		obj.type === "annotation" &&
		(typeof obj.id !== "string" || typeof obj.comment !== "string")
	) {
		return false;
	}
	return true;
};

/**
 * Parses a JSON string into a markup array.
 * Returns an empty array for invalid input or if the data does not
 * match the expected {@link ContentMarkup} structure.
 *
 * @param json - The JSON string to parse
 * @returns The parsed markup array, or an empty array on failure
 */
export const parseMarkups = (json: string): ContentMarkup[] => {
	if (!json || json === "[]") {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(json);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter(isValidMarkup);
	} catch {
		return [];
	}
};
