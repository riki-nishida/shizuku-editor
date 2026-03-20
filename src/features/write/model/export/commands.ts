import { invokeCommand } from "@shared/lib/commands";
import type {
	DocxExportPayload,
	EpubExportPayload,
	ExportPreviewPayload,
	ExportPreviewResult,
	ExportResult,
	PdfExportPayload,
	TxtExportPayload,
} from "./types";

export const exportTxt = (payload: TxtExportPayload) => {
	return invokeCommand<ExportResult>("export_txt", { payload });
};

export const exportDocx = (payload: DocxExportPayload) => {
	return invokeCommand<ExportResult>("export_docx", { payload });
};

export const exportPdf = (payload: PdfExportPayload) => {
	return invokeCommand<ExportResult>("export_pdf", { payload });
};

export const generateExportPreview = (payload: ExportPreviewPayload) => {
	return invokeCommand<ExportPreviewResult>("generate_export_preview", {
		payload,
	});
};

export const exportEpub = (payload: EpubExportPayload) => {
	return invokeCommand<ExportResult>("export_epub", { payload });
};
