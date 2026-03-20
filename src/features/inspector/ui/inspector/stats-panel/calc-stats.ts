const CHARS_PER_MINUTE = 600;

export type ContentStats = {
	charCount: number;
	charCountWithSpaces: number;
	paragraphCount: number;
	readingMinutes: number;
};

export function calcStats(contentText: string): ContentStats {
	const charCountWithSpaces = contentText.length;

	const charCount = contentText.replace(/\s+/g, "").length;

	const paragraphCount = contentText
		.split(/\n+/)
		.filter((p) => p.trim().length > 0).length;

	const readingMinutes =
		charCount > 0 ? Math.ceil(charCount / CHARS_PER_MINUTE) : 0;

	return {
		charCount,
		charCountWithSpaces,
		paragraphCount,
		readingMinutes,
	};
}
