use epub_builder::{EpubBuilder, EpubContent, ZipLibrary};
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;

use super::common::{content_to_html, escape_html, get_export_data, ExportChapter, ExportScene};
use crate::db::DbPool;
use crate::error::{AppError, AppResult};
use crate::models::{EpubExportPayload, ExportResult, WritingMode};

pub async fn export_epub(pool: &DbPool, payload: EpubExportPayload) -> AppResult<ExportResult> {
    let data = get_export_data(
        pool,
        &payload.work_id,
        payload.chapter_ids.as_ref(),
        payload.scene_ids.as_ref(),
    )
    .await?;

    let filepath = PathBuf::from(&payload.export_path);
    let file = File::create(&filepath)?;
    let writer = BufWriter::new(file);

    let mut epub = EpubBuilder::new(
        ZipLibrary::new()
            .map_err(|e| AppError::Internal(format!("Failed to create zip library: {}", e)))?,
    )
    .map_err(|e| AppError::Internal(format!("Failed to create epub builder: {}", e)))?;

    epub.metadata("title", &data.work.name)
        .map_err(|e| AppError::Internal(format!("Failed to set title: {}", e)))?;
    epub.metadata("lang", "ja")
        .map_err(|e| AppError::Internal(format!("Failed to set language: {}", e)))?;

    if let Some(ref author) = payload.author {
        if !author.is_empty() {
            epub.metadata("author", author)
                .map_err(|e| AppError::Internal(format!("Failed to set author: {}", e)))?;
        }
    }

    let css = generate_stylesheet(&payload.writing_mode);
    epub.stylesheet(css.as_bytes())
        .map_err(|e| AppError::Internal(format!("Failed to add stylesheet: {}", e)))?;

    let mut chapter_index = 0;
    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        let chapter_html = generate_chapter_html(chapter, &chapter_scenes, &payload);

        let filename = format!("chapter_{}.xhtml", chapter_index);
        let title = if payload.include_chapter_titles {
            chapter.title.clone()
        } else {
            format!("Chapter {}", chapter_index + 1)
        };

        epub.add_content(
            EpubContent::new(&filename, chapter_html.as_bytes())
                .title(&title)
                .reftype(epub_builder::ReferenceType::Text),
        )
        .map_err(|e| AppError::Internal(format!("Failed to add chapter: {}", e)))?;

        chapter_index += 1;
    }

    epub.generate(writer)
        .map_err(|e| AppError::Internal(format!("Failed to generate ePub: {}", e)))?;

    Ok(ExportResult {
        saved_paths: vec![filepath.to_string_lossy().to_string()],
    })
}

fn generate_stylesheet(writing_mode: &WritingMode) -> String {
    let writing_mode_css = match writing_mode {
        WritingMode::Vertical => "writing-mode: vertical-rl; text-orientation: upright;",
        WritingMode::Horizontal => "writing-mode: horizontal-tb;",
    };

    format!(
        r#"@charset "UTF-8";

body {{
    font-family: "Hiragino Mincho ProN", "Yu Mincho", serif;
    font-size: 1em;
    line-height: 1.8;
    {writing_mode}
    margin: 1em;
}}

h1 {{
    font-size: 1.5em;
    font-weight: bold;
    margin: 1em 0;
    text-align: center;
}}

h2 {{
    font-size: 1.2em;
    font-weight: bold;
    margin: 0.8em 0;
}}

p {{
    margin: 0;
}}

p.empty {{
    height: 1em;
}}

ruby {{
    ruby-align: center;
}}

rt {{
    font-size: 0.5em;
}}

.emphasis {{
    text-emphasis-style: filled dot;
    -webkit-text-emphasis-style: filled dot;
}}

.scene-separator {{
    text-align: center;
    margin: 1.5em 0;
}}
"#,
        writing_mode = writing_mode_css
    )
}

fn generate_chapter_html(
    chapter: &ExportChapter,
    scenes: &[&ExportScene],
    payload: &EpubExportPayload,
) -> String {
    let mut html = String::from(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ja" lang="ja">
<head>
    <meta charset="UTF-8"/>
    <title></title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
"#,
    );

    if payload.include_chapter_titles {
        html.push_str(&format!("<h1>{}</h1>\n", escape_html(&chapter.title)));
    }

    for (i, scene) in scenes.iter().enumerate() {
        if i > 0 && !payload.include_scene_titles {
            html.push_str("<div class=\"scene-separator\">＊　＊　＊</div>\n");
        }

        if payload.include_scene_titles {
            html.push_str(&format!("<h2>{}</h2>\n", escape_html(&scene.title)));
        }

        let scene_html = content_to_html(
            &scene.content_text,
            &scene.content_markups,
            payload.auto_indent,
        );
        html.push_str(&scene_html);
    }

    html.push_str("</body>\n</html>");
    html
}
