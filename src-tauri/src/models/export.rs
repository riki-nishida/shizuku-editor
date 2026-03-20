use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Txt,
    Docx,
    Pdf,
    Epub,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ExportMode {
    SingleFile,
    PerChapter,
    PerScene,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RubyMode {
    Angle,
    Paren,
    None,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TxtExportPayload {
    pub work_id: String,
    pub mode: ExportMode,
    pub scene_ids: Option<Vec<String>>,
    pub chapter_ids: Option<Vec<String>>,
    pub include_chapter_titles: bool,
    pub include_scene_titles: bool,
    pub include_separators: bool,
    pub ruby_mode: RubyMode,
    pub export_path: String,
    #[serde(default)]
    pub auto_indent: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocxExportPayload {
    pub work_id: String,
    pub scene_ids: Option<Vec<String>>,
    pub chapter_ids: Option<Vec<String>>,
    pub include_chapter_titles: bool,
    pub include_scene_titles: bool,
    pub writing_mode: WritingMode,
    pub export_path: String,
    #[serde(default)]
    pub auto_indent: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub saved_paths: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPreviewPayload {
    pub work_id: String,
    pub format: ExportFormat,
    pub scene_ids: Option<Vec<String>>,
    pub chapter_ids: Option<Vec<String>>,
    pub include_chapter_titles: bool,
    pub include_scene_titles: bool,
    pub include_separators: bool,
    pub ruby_mode: RubyMode,
    #[serde(default)]
    pub auto_indent: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WritingMode {
    Horizontal,
    Vertical,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PdfPageSize {
    A4,
    A5,
    B5,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfExportPayload {
    pub work_id: String,
    pub scene_ids: Option<Vec<String>>,
    pub chapter_ids: Option<Vec<String>>,
    pub include_chapter_titles: bool,
    pub include_scene_titles: bool,
    pub ruby_mode: RubyMode,
    pub page_size: PdfPageSize,
    pub export_path: String,
    #[serde(default)]
    pub auto_indent: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPreviewResult {
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EpubExportPayload {
    pub work_id: String,
    pub scene_ids: Option<Vec<String>>,
    pub chapter_ids: Option<Vec<String>>,
    pub include_chapter_titles: bool,
    pub include_scene_titles: bool,
    pub writing_mode: WritingMode,
    pub author: Option<String>,
    pub export_path: String,
    #[serde(default)]
    pub auto_indent: bool,
}
