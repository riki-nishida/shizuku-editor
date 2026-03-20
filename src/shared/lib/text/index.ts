export const calculateWordCount = (text: string): number =>
	text.replace(/\s+/g, "").length;
