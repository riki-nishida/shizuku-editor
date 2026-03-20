use printpdf::ops::PdfFontHandle;
use printpdf::*;
use std::fs::File;
use std::io::Write as IoWrite;
use std::path::PathBuf;

use super::common::{content_to_txt, get_export_data, should_auto_indent, ExportScene};
use crate::db::DbPool;
use crate::error::{AppError, AppResult};
use crate::models::{ExportResult, PdfExportPayload, PdfPageSize};

const FONT_SIZE_TITLE: f32 = 16.0;
const FONT_SIZE_CHAPTER: f32 = 14.0;
const FONT_SIZE_SCENE: f32 = 12.0;
const FONT_SIZE_BODY: f32 = 10.5;
const LINE_HEIGHT: f32 = 1.7;
const MARGIN_MM: f32 = 25.0;

const PT_TO_MM: f32 = 0.3528;
const MM_TO_PT: f32 = 2.83465;

pub async fn export_pdf(pool: &DbPool, payload: PdfExportPayload) -> AppResult<ExportResult> {
    let data = get_export_data(
        pool,
        &payload.work_id,
        payload.chapter_ids.as_ref(),
        payload.scene_ids.as_ref(),
    )
    .await?;

    let filepath = PathBuf::from(&payload.export_path);

    let (page_width, page_height) = get_page_dimensions(&payload.page_size);

    let mut doc = PdfDocument::new(&data.work.name);

    let font_id = load_japanese_font(&mut doc)?;

    let ctx = PdfBuildContext {
        font_id: &font_id,
        work_name: &data.work.name,
        chapters: &data.chapters,
        scenes: &data.scenes,
        payload: &payload,
        page_width,
        page_height,
    };
    let pages = build_pdf_pages(&ctx)?;

    let mut warnings = Vec::new();
    let pdf_bytes = doc
        .with_pages(pages)
        .save(&PdfSaveOptions::default(), &mut warnings);

    let mut file = File::create(&filepath)?;
    file.write_all(&pdf_bytes)?;

    Ok(ExportResult {
        saved_paths: vec![filepath.to_string_lossy().to_string()],
    })
}

fn get_page_dimensions(page_size: &PdfPageSize) -> (f32, f32) {
    match page_size {
        PdfPageSize::A4 => (210.0, 297.0),
        PdfPageSize::A5 => (148.0, 210.0),
        PdfPageSize::B5 => (176.0, 250.0),
    }
}

fn load_japanese_font(doc: &mut PdfDocument) -> AppResult<FontId> {
    let font_paths = get_japanese_font_paths();

    for path in &font_paths {
        if let Ok(font_bytes) = std::fs::read(path) {
            let mut warnings = Vec::new();
            if let Some(parsed_font) = ParsedFont::from_bytes(&font_bytes, 0, &mut warnings) {
                return Ok(doc.add_font(&parsed_font));
            }
        }
    }

    Err(AppError::Internal(
        "Japanese font not found. Please ensure a Japanese font is installed on your system."
            .to_string(),
    ))
}

fn get_japanese_font_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(target_os = "macos")]
    {
        paths.push(PathBuf::from("/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"));
        paths.push(PathBuf::from("/System/Library/Fonts/Hiragino Sans GB.ttc"));
        paths.push(PathBuf::from(
            "/System/Library/Fonts/Supplemental/Hiragino Mincho Pro.otf",
        ));
        paths.push(PathBuf::from("/Library/Fonts/Yu Mincho.otf"));
        paths.push(PathBuf::from(
            "/System/Library/Fonts/Supplemental/Yu Mincho.otf",
        ));
        paths.push(PathBuf::from("/Library/Fonts/NotoSerifJP-Regular.otf"));
        paths.push(PathBuf::from("/Library/Fonts/NotoSansJP-Regular.otf"));
        if let Ok(home) = std::env::var("HOME") {
            paths.push(PathBuf::from(format!(
                "{}/Library/Fonts/NotoSerifJP-Regular.otf",
                home
            )));
            paths.push(PathBuf::from(format!(
                "{}/Library/Fonts/NotoSansJP-Regular.otf",
                home
            )));
        }
    }

    #[cfg(target_os = "windows")]
    {
        let windows_fonts = std::env::var("SYSTEMROOT")
            .map(|root| PathBuf::from(root).join("Fonts"))
            .unwrap_or_else(|_| PathBuf::from("C:\\Windows\\Fonts"));

        paths.push(windows_fonts.join("YuMincho.ttf"));
        paths.push(windows_fonts.join("yugothic.ttf"));
        paths.push(windows_fonts.join("msgothic.ttc"));
        paths.push(windows_fonts.join("msmincho.ttc"));
        paths.push(windows_fonts.join("meiryo.ttc"));
    }

    #[cfg(target_os = "linux")]
    {
        paths.push(PathBuf::from(
            "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
        ));
        paths.push(PathBuf::from(
            "/usr/share/fonts/google-noto-cjk/NotoSerifCJK-Regular.ttc",
        ));
        paths.push(PathBuf::from(
            "/usr/share/fonts/truetype/takao-gothic/TakaoPGothic.ttf",
        ));
        paths.push(PathBuf::from(
            "/usr/share/fonts/truetype/takao-mincho/TakaoMincho.ttf",
        ));
        paths.push(PathBuf::from(
            "/usr/share/fonts/noto-cjk/NotoSerifCJK-Regular.ttc",
        ));
        paths.push(PathBuf::from(
            "/usr/share/fonts/google-noto/NotoSerifJP-Regular.otf",
        ));
    }

    paths
}

use super::common::ExportChapter;

struct PdfBuildContext<'a> {
    font_id: &'a FontId,
    work_name: &'a str,
    chapters: &'a [ExportChapter],
    scenes: &'a [ExportScene],
    payload: &'a PdfExportPayload,
    page_width: f32,
    page_height: f32,
}

fn build_pdf_pages(ctx: &PdfBuildContext) -> AppResult<Vec<PdfPage>> {
    let page_width = ctx.page_width;
    let page_height = ctx.page_height;
    let font_id = ctx.font_id;
    let content_width = page_width - (MARGIN_MM * 2.0);

    let title_height_mm = FONT_SIZE_TITLE * PT_TO_MM;
    let chapter_height_mm = FONT_SIZE_CHAPTER * PT_TO_MM;
    let scene_height_mm = FONT_SIZE_SCENE * PT_TO_MM;
    let body_height_mm = FONT_SIZE_BODY * PT_TO_MM;
    let line_spacing_mm = body_height_mm * LINE_HEIGHT;

    let mut pages: Vec<PdfPage> = Vec::new();
    let mut current_ops: Vec<Op> = Vec::new();
    let mut y_position = page_height - MARGIN_MM;

    let mut finish_page = |ops: &mut Vec<Op>| {
        if !ops.is_empty() {
            let page = PdfPage::new(Mm(page_width), Mm(page_height), std::mem::take(ops));
            pages.push(page);
        }
    };

    let mut check_page_break = |ops: &mut Vec<Op>, y: &mut f32, needed_height: f32| {
        if *y < MARGIN_MM + needed_height {
            finish_page(ops);
            *y = page_height - MARGIN_MM;
        }
    };

    y_position -= title_height_mm;
    current_ops.push(Op::StartTextSection);
    current_ops.push(Op::SetTextCursor {
        pos: Point {
            x: Pt(MARGIN_MM * MM_TO_PT),
            y: Pt(y_position * MM_TO_PT),
        },
    });
    current_ops.push(Op::SetFont {
        font: PdfFontHandle::External(font_id.clone()),
        size: Pt(FONT_SIZE_TITLE),
    });
    current_ops.push(Op::ShowText {
        items: vec![TextItem::Text(ctx.work_name.to_string())],
    });
    current_ops.push(Op::EndTextSection);
    y_position -= title_height_mm * LINE_HEIGHT + 5.0;

    for chapter in ctx.chapters {
        let chapter_scenes: Vec<&ExportScene> = ctx
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        if ctx.payload.include_chapter_titles {
            let needed = chapter_height_mm * LINE_HEIGHT;
            check_page_break(&mut current_ops, &mut y_position, needed);
            y_position -= chapter_height_mm;

            current_ops.push(Op::StartTextSection);
            current_ops.push(Op::SetTextCursor {
                pos: Point {
                    x: Pt(MARGIN_MM * MM_TO_PT),
                    y: Pt(y_position * MM_TO_PT),
                },
            });
            current_ops.push(Op::SetFont {
                font: PdfFontHandle::External(font_id.clone()),
                size: Pt(FONT_SIZE_CHAPTER),
            });
            current_ops.push(Op::ShowText {
                items: vec![TextItem::Text(chapter.title.clone())],
            });
            current_ops.push(Op::EndTextSection);
            y_position -= chapter_height_mm * 0.8;
        }

        for scene in &chapter_scenes {
            if ctx.payload.include_scene_titles {
                let needed = scene_height_mm * LINE_HEIGHT;
                check_page_break(&mut current_ops, &mut y_position, needed);
                y_position -= scene_height_mm;

                current_ops.push(Op::StartTextSection);
                current_ops.push(Op::SetTextCursor {
                    pos: Point {
                        x: Pt(MARGIN_MM * MM_TO_PT),
                        y: Pt(y_position * MM_TO_PT),
                    },
                });
                current_ops.push(Op::SetFont {
                    font: PdfFontHandle::External(font_id.clone()),
                    size: Pt(FONT_SIZE_SCENE),
                });
                current_ops.push(Op::ShowText {
                    items: vec![TextItem::Text(scene.title.clone())],
                });
                current_ops.push(Op::EndTextSection);
                y_position -= line_spacing_mm;
            }

            let body_text = content_to_txt(
                &scene.content_text,
                &scene.content_markups,
                &ctx.payload.ruby_mode,
            );

            for line in body_text.lines() {
                if line.is_empty() {
                    y_position -= line_spacing_mm * 0.5;
                    continue;
                }

                let indented_line = if ctx.payload.auto_indent && should_auto_indent(line) {
                    format!("　{}", line)
                } else {
                    line.to_string()
                };

                let wrapped_lines = wrap_text(&indented_line, content_width, FONT_SIZE_BODY);
                for wrapped_line in wrapped_lines {
                    check_page_break(&mut current_ops, &mut y_position, line_spacing_mm);

                    current_ops.push(Op::StartTextSection);
                    current_ops.push(Op::SetTextCursor {
                        pos: Point {
                            x: Pt(MARGIN_MM * MM_TO_PT),
                            y: Pt(y_position * MM_TO_PT),
                        },
                    });
                    current_ops.push(Op::SetFont {
                        font: PdfFontHandle::External(font_id.clone()),
                        size: Pt(FONT_SIZE_BODY),
                    });
                    current_ops.push(Op::ShowText {
                        items: vec![TextItem::Text(wrapped_line)],
                    });
                    current_ops.push(Op::EndTextSection);

                    y_position -= line_spacing_mm;
                }
            }

            y_position -= line_spacing_mm * 0.3;
        }
    }

    finish_page(&mut current_ops);

    if pages.is_empty() {
        pages.push(PdfPage::new(Mm(page_width), Mm(page_height), vec![]));
    }

    Ok(pages)
}

fn wrap_text(text: &str, max_width_mm: f32, font_size: f32) -> Vec<String> {
    let full_width_char_mm = font_size * 0.3528;
    let half_width_char_mm = full_width_char_mm * 0.5;

    let mut lines = Vec::new();
    let mut current_line = String::new();
    let mut current_width_mm: f32 = 0.0;

    for c in text.chars() {
        let char_width = if c.is_ascii() {
            half_width_char_mm
        } else {
            full_width_char_mm
        };

        if current_width_mm + char_width > max_width_mm && !current_line.is_empty() {
            lines.push(current_line);
            current_line = String::new();
            current_width_mm = 0.0;
        }

        current_line.push(c);
        current_width_mm += char_width;
    }

    if !current_line.is_empty() {
        lines.push(current_line);
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}
