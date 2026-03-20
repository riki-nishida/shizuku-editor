use chrono::Local;
use std::fs;
use std::path::PathBuf;

use super::common::{
    content_to_html, content_to_txt, escape_html, get_export_data, post_process_text,
    sanitize_filename, ExportChapter, ExportData, ExportScene,
};
use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{
    ExportFormat, ExportMode, ExportPreviewPayload, ExportPreviewResult, ExportResult,
    TxtExportPayload,
};

pub async fn export_txt(pool: &DbPool, payload: TxtExportPayload) -> AppResult<ExportResult> {
    let data = get_export_data(
        pool,
        &payload.work_id,
        payload.chapter_ids.as_ref(),
        payload.scene_ids.as_ref(),
    )
    .await?;

    let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let sanitized_work_name = sanitize_filename(&data.work.name);

    let saved_paths = match payload.mode {
        ExportMode::SingleFile => {
            export_single_file(&data, &payload, &sanitized_work_name, &timestamp)?
        }
        ExportMode::PerChapter => {
            export_per_chapter(&data, &payload, &sanitized_work_name, &timestamp)?
        }
        ExportMode::PerScene => {
            export_per_scene(&data, &payload, &sanitized_work_name, &timestamp)?
        }
    };

    Ok(ExportResult { saved_paths })
}

fn export_single_file(
    data: &ExportData,
    payload: &TxtExportPayload,
    _sanitized_work_name: &str,
    _timestamp: &str,
) -> AppResult<Vec<String>> {
    let content = format_full_content(data, payload);
    let filepath = PathBuf::from(&payload.export_path);

    fs::write(&filepath, content)?;

    Ok(vec![filepath.to_string_lossy().to_string()])
}

fn export_per_chapter(
    data: &ExportData,
    payload: &TxtExportPayload,
    sanitized_work_name: &str,
    timestamp: &str,
) -> AppResult<Vec<String>> {
    let dir_name = format!("{}_{}", sanitized_work_name, timestamp);
    let dir_path = PathBuf::from(&payload.export_path).join(&dir_name);
    fs::create_dir_all(&dir_path)?;

    let mut saved_paths = vec![];

    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        let content = format_chapter_content(chapter, &chapter_scenes, payload);
        let sanitized_chapter_title = sanitize_filename(&chapter.title);
        let filename = format!(
            "Chapter_{:03}_{}.txt",
            chapter.sort_order, sanitized_chapter_title
        );
        let filepath = dir_path.join(&filename);

        fs::write(&filepath, content)?;
        saved_paths.push(filepath.to_string_lossy().to_string());
    }

    if saved_paths.is_empty() {
        saved_paths.push(dir_path.to_string_lossy().to_string());
    }

    Ok(saved_paths)
}

fn export_per_scene(
    data: &ExportData,
    payload: &TxtExportPayload,
    sanitized_work_name: &str,
    timestamp: &str,
) -> AppResult<Vec<String>> {
    let dir_name = format!("{}_{}", sanitized_work_name, timestamp);
    let dir_path = PathBuf::from(&payload.export_path).join(&dir_name);
    fs::create_dir_all(&dir_path)?;

    let mut saved_paths = vec![];

    for (index, scene) in data.scenes.iter().enumerate() {
        let content = format_scene_content(scene, payload);
        let sanitized_scene_title = sanitize_filename(&scene.title);
        let filename = format!("Scene_{:04}_{}.txt", index + 1, sanitized_scene_title);
        let filepath = dir_path.join(&filename);

        fs::write(&filepath, content)?;
        saved_paths.push(filepath.to_string_lossy().to_string());
    }

    if saved_paths.is_empty() {
        saved_paths.push(dir_path.to_string_lossy().to_string());
    }

    Ok(saved_paths)
}

fn format_full_content(data: &ExportData, payload: &TxtExportPayload) -> String {
    let mut output = String::new();

    output.push_str(&format!("{}\n\n", data.work.name));

    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        if payload.include_chapter_titles {
            output.push_str(&format!("{}\n\n", chapter.title));
        }

        for (i, scene) in chapter_scenes.iter().enumerate() {
            if i > 0 {
                output.push_str(&format_scene_separator(payload));
            }
            output.push_str(&format_scene_block(scene, payload));
        }
    }

    post_process_text(&output, true, payload.auto_indent)
}

fn format_chapter_content(
    chapter: &ExportChapter,
    scenes: &[&ExportScene],
    payload: &TxtExportPayload,
) -> String {
    let mut output = String::new();

    if payload.include_chapter_titles {
        output.push_str(&format!("{}\n\n", chapter.title));
    }

    for (i, scene) in scenes.iter().enumerate() {
        if i > 0 {
            output.push_str(&format_scene_separator(payload));
        }
        output.push_str(&format_scene_block(scene, payload));
    }

    post_process_text(&output, true, payload.auto_indent)
}

fn format_scene_content(scene: &ExportScene, payload: &TxtExportPayload) -> String {
    let output = format_scene_block(scene, payload);
    post_process_text(&output, true, payload.auto_indent)
}

fn format_scene_separator(payload: &TxtExportPayload) -> String {
    if payload.include_scene_titles {
        "\n".to_string()
    } else {
        "\n　　　＊＊＊\n\n".to_string()
    }
}

fn format_scene_block(scene: &ExportScene, payload: &TxtExportPayload) -> String {
    let mut output = String::new();

    if payload.include_scene_titles {
        output.push_str(&format!("{}\n\n", scene.title));
    }

    let body_text = content_to_txt(
        &scene.content_text,
        &scene.content_markups,
        &payload.ruby_mode,
    );
    output.push_str(&body_text);
    output.push('\n');

    output
}

pub async fn generate_export_preview(
    pool: &DbPool,
    payload: ExportPreviewPayload,
) -> AppResult<ExportPreviewResult> {
    let data = get_export_data(
        pool,
        &payload.work_id,
        payload.chapter_ids.as_ref(),
        payload.scene_ids.as_ref(),
    )
    .await?;

    let content = match payload.format {
        ExportFormat::Docx | ExportFormat::Epub => format_html_preview(&data, &payload),
        ExportFormat::Pdf => format_pdf_html_preview(&data, &payload),
        ExportFormat::Txt => format_text_preview(&data, &payload),
    };

    Ok(ExportPreviewResult { content })
}

fn format_text_preview(data: &ExportData, payload: &ExportPreviewPayload) -> String {
    let mut output = String::new();

    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        if payload.include_chapter_titles {
            output.push_str(&format!("{}\n\n", chapter.title));
        }

        for (i, scene) in chapter_scenes.iter().enumerate() {
            if i > 0 {
                output.push_str(&format_text_scene_separator(payload));
            }
            output.push_str(&format_text_scene_block(scene, payload));
        }
    }

    post_process_text(&output, true, payload.auto_indent)
}

fn format_text_scene_separator(payload: &ExportPreviewPayload) -> String {
    if payload.include_scene_titles {
        "\n".to_string()
    } else {
        "\n　　　＊＊＊\n\n".to_string()
    }
}

fn format_text_scene_block(scene: &ExportScene, payload: &ExportPreviewPayload) -> String {
    let mut output = String::new();

    if payload.include_scene_titles {
        output.push_str(&format!("{}\n\n", scene.title));
    }

    let body_text = content_to_txt(
        &scene.content_text,
        &scene.content_markups,
        &payload.ruby_mode,
    );
    output.push_str(&body_text);
    output.push('\n');

    output
}

fn format_pdf_html_preview(data: &ExportData, payload: &ExportPreviewPayload) -> String {
    let text = format_text_preview(data, payload);
    text_to_html_paragraphs(&text)
}

fn text_to_html_paragraphs(text: &str) -> String {
    let mut html = String::new();
    for line in text.lines() {
        if line.trim().is_empty() {
            html.push_str("<p class=\"empty\"></p>\n");
        } else {
            html.push_str(&format!("<p>{}</p>\n", escape_html(line)));
        }
    }
    html
}

fn format_html_preview(data: &ExportData, payload: &ExportPreviewPayload) -> String {
    let mut html = String::new();

    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        if payload.include_chapter_titles {
            html.push_str(&format!(
                "<h2>{}</h2>\n<p class=\"empty\"></p>\n",
                escape_html(&chapter.title)
            ));
        }

        for (i, scene) in chapter_scenes.iter().enumerate() {
            if i > 0 {
                html.push_str(
                    "<div class=\"scene-separator\">\u{3000}\u{3000}\u{3000}＊＊＊</div>\n",
                );
            }

            if payload.include_scene_titles {
                html.push_str(&format!(
                    "<h3>{}</h3>\n<p class=\"empty\"></p>\n",
                    escape_html(&scene.title)
                ));
            }

            html.push_str(&content_to_html(
                &scene.content_text,
                &scene.content_markups,
                payload.auto_indent,
            ));
        }
    }

    html
}
