export type ExportFormat = "txt" | "docx" | "pdf" | "epub";

export type ExportMode = "single-file" | "per-chapter" | "per-scene";

export type RubyMode = "angle" | "paren" | "none";

export type WritingMode = "horizontal" | "vertical";

export type PdfPageSize = "a4" | "a5" | "b5";

export type ExportSettings = {
	format: ExportFormat;
	mode: ExportMode;
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	includeSeparators: boolean;
	rubyMode: RubyMode;
	pageSize: PdfPageSize;
	writingMode: WritingMode;
	author: string;
	autoIndent: boolean;
};

export type TxtExportPayload = {
	workId: string;
	mode: ExportMode;
	sceneIds?: string[];
	chapterIds?: string[];
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	includeSeparators: boolean;
	rubyMode: RubyMode;
	exportPath: string;
	autoIndent: boolean;
};

export type DocxExportPayload = {
	workId: string;
	sceneIds?: string[];
	chapterIds?: string[];
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	writingMode: WritingMode;
	exportPath: string;
	autoIndent: boolean;
};

export type PdfExportPayload = {
	workId: string;
	sceneIds?: string[];
	chapterIds?: string[];
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	rubyMode: RubyMode;
	pageSize: PdfPageSize;
	exportPath: string;
	autoIndent: boolean;
};

export type ExportResult = {
	savedPaths: string[];
};

export type EpubExportPayload = {
	workId: string;
	sceneIds?: string[];
	chapterIds?: string[];
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	writingMode: WritingMode;
	author?: string;
	exportPath: string;
	autoIndent: boolean;
};

export type ExportPreviewPayload = {
	workId: string;
	format: ExportFormat;
	sceneIds?: string[];
	chapterIds?: string[];
	includeChapterTitles: boolean;
	includeSceneTitles: boolean;
	includeSeparators: boolean;
	rubyMode: RubyMode;
	autoIndent: boolean;
};

export type ExportPreviewResult = {
	content: string;
};
