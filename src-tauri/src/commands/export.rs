use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{
    DocxExportPayload, EpubExportPayload, ExportPreviewPayload, ExportPreviewResult, ExportResult,
    PdfExportPayload, TxtExportPayload,
};
use crate::services::export;

#[tauri::command]
pub async fn export_txt(
    pool: State<'_, DbPool>,
    payload: TxtExportPayload,
) -> Result<ExportResult, AppError> {
    export::export_txt(pool.inner(), payload).await
}

#[tauri::command]
pub async fn export_docx(
    pool: State<'_, DbPool>,
    payload: DocxExportPayload,
) -> Result<ExportResult, AppError> {
    export::export_docx(pool.inner(), payload).await
}

#[tauri::command]
pub async fn generate_export_preview(
    pool: State<'_, DbPool>,
    payload: ExportPreviewPayload,
) -> Result<ExportPreviewResult, AppError> {
    export::generate_export_preview(pool.inner(), payload).await
}

#[tauri::command]
pub async fn export_pdf(
    pool: State<'_, DbPool>,
    payload: PdfExportPayload,
) -> Result<ExportResult, AppError> {
    export::export_pdf(pool.inner(), payload).await
}

#[tauri::command]
pub async fn export_epub(
    pool: State<'_, DbPool>,
    payload: EpubExportPayload,
) -> Result<ExportResult, AppError> {
    export::export_epub(pool.inner(), payload).await
}
