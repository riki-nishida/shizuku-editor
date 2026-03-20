use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::models::{
    ExportFormat, ExportMode, ExportPreviewPayload, RubyMode, TxtExportPayload,
};
use shizuku_editor_lib::services::{chapter, export, scene, work};
use std::fs;
use std::path::PathBuf;

fn create_temp_dir(test_name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("shizuku_test_{}", test_name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).expect("Failed to create temp dir");
    dir
}

async fn setup_test_work(pool: &sqlx::SqlitePool) -> (String, String, String) {
    let work_id = work::create_work(pool, "テスト作品", &Language::Ja)
        .await
        .expect("Failed to create work");

    let chapter = chapter::create_chapter(pool, &work_id, "第一章")
        .await
        .expect("Failed to create chapter");

    let scene_outline = scene::create_scene(pool, &chapter.id, "シーン1")
        .await
        .expect("Failed to create scene");

    scene::update_scene_content(pool, &scene_outline.id, "これはテスト本文です。", "[]")
        .await
        .expect("Failed to update scene content");

    (work_id, chapter.id, scene_outline.id)
}

#[tokio::test]
async fn test_export_txt_single_file() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let (work_id, _chapter_id, scene_id) = setup_test_work(&pool).await;

    let temp_dir = create_temp_dir("export_txt_single");
    let export_path = temp_dir.join("output.txt");

    let payload = TxtExportPayload {
        work_id,
        mode: ExportMode::SingleFile,
        scene_ids: Some(vec![scene_id]),
        chapter_ids: None,
        include_chapter_titles: true,
        include_scene_titles: true,
        include_separators: true,
        ruby_mode: RubyMode::None,
        export_path: export_path.to_string_lossy().to_string(),
        auto_indent: false,
    };

    let result = export::export_txt(&pool, payload)
        .await
        .expect("Failed to export TXT");

    assert_eq!(result.saved_paths.len(), 1);
    assert!(export_path.exists(), "Export file should exist");

    let content = fs::read_to_string(&export_path).expect("Failed to read exported file");
    assert!(content.contains("テスト作品"), "Should contain work name");
    assert!(content.contains("第一章"), "Should contain chapter title");
    assert!(content.contains("シーン1"), "Should contain scene title");
    assert!(
        content.contains("これはテスト本文です。"),
        "Should contain body text"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_export_txt_without_titles() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let (work_id, _chapter_id, scene_id) = setup_test_work(&pool).await;

    let temp_dir = create_temp_dir("export_txt_no_titles");
    let export_path = temp_dir.join("output.txt");

    let payload = TxtExportPayload {
        work_id,
        mode: ExportMode::SingleFile,
        scene_ids: Some(vec![scene_id]),
        chapter_ids: None,
        include_chapter_titles: false,
        include_scene_titles: false,
        include_separators: false,
        ruby_mode: RubyMode::None,
        export_path: export_path.to_string_lossy().to_string(),
        auto_indent: false,
    };

    let result = export::export_txt(&pool, payload)
        .await
        .expect("Failed to export TXT");

    assert_eq!(result.saved_paths.len(), 1);

    let content = fs::read_to_string(&export_path).expect("Failed to read exported file");
    assert!(
        content.contains("テスト作品"),
        "Should contain work name in header"
    );
    assert!(
        !content.contains("=== 第一章 ==="),
        "Should not contain chapter title marker"
    );
    assert!(
        !content.contains("--- シーン"),
        "Should not contain scene title marker"
    );
    assert!(
        content.contains("これはテスト本文です。"),
        "Should contain body text"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_export_txt_per_chapter() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let (work_id, chapter_id, scene_id) = setup_test_work(&pool).await;

    let temp_dir = create_temp_dir("export_txt_per_chapter");

    let payload = TxtExportPayload {
        work_id,
        mode: ExportMode::PerChapter,
        scene_ids: Some(vec![scene_id]),
        chapter_ids: Some(vec![chapter_id]),
        include_chapter_titles: true,
        include_scene_titles: true,
        include_separators: true,
        ruby_mode: RubyMode::None,
        export_path: temp_dir.to_string_lossy().to_string(),
        auto_indent: false,
    };

    let result = export::export_txt(&pool, payload)
        .await
        .expect("Failed to export TXT");

    assert!(!result.saved_paths.is_empty(), "Should have saved paths");
    for path in &result.saved_paths {
        assert!(
            std::path::Path::new(path).exists(),
            "Exported file should exist: {}",
            path
        );
    }

    let _ = fs::remove_dir_all(&temp_dir);
}

#[tokio::test]
async fn test_generate_export_preview() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let (work_id, _chapter_id, scene_id) = setup_test_work(&pool).await;

    let payload = ExportPreviewPayload {
        work_id,
        format: ExportFormat::Txt,
        scene_ids: Some(vec![scene_id]),
        chapter_ids: None,
        include_chapter_titles: true,
        include_scene_titles: true,
        include_separators: true,
        ruby_mode: RubyMode::None,
        auto_indent: false,
    };

    let result = export::generate_export_preview(&pool, payload)
        .await
        .expect("Failed to generate preview");

    assert!(
        result.content.contains("第一章"),
        "Preview should contain chapter title"
    );
    assert!(
        result.content.contains("シーン1"),
        "Preview should contain scene title"
    );
    assert!(
        result.content.contains("これはテスト本文です。"),
        "Preview should contain body text"
    );
}

#[tokio::test]
async fn test_preview_no_leading_blank_lines_without_titles() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let (work_id, _chapter_id, scene_id) = setup_test_work(&pool).await;

    let payload = ExportPreviewPayload {
        work_id,
        format: ExportFormat::Txt,
        scene_ids: Some(vec![scene_id]),
        chapter_ids: None,
        include_chapter_titles: false,
        include_scene_titles: false,
        include_separators: false,
        ruby_mode: RubyMode::None,
        auto_indent: false,
    };

    let result = export::generate_export_preview(&pool, payload)
        .await
        .expect("Failed to generate preview");

    assert!(
        !result.content.starts_with('\n'),
        "Preview should not start with blank line"
    );
    assert!(
        result.content.starts_with("これはテスト本文です。"),
        "Preview should start with body text"
    );
}

#[tokio::test]
async fn test_export_with_ruby_angle_mode() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let work_id = work::create_work(&pool, "ルビテスト", &Language::Ja)
        .await
        .expect("Failed to create work");

    let chapter = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .expect("Failed to create chapter");

    let scene_outline = scene::create_scene(&pool, &chapter.id, "シーン")
        .await
        .expect("Failed to create scene");

    scene::update_scene_content(
        &pool,
        &scene_outline.id,
        "漢字のテスト",
        r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#,
    )
    .await
    .expect("Failed to update scene content");

    let payload = ExportPreviewPayload {
        work_id,
        format: ExportFormat::Txt,
        scene_ids: Some(vec![scene_outline.id]),
        chapter_ids: None,
        include_chapter_titles: false,
        include_scene_titles: false,
        include_separators: false,
        ruby_mode: RubyMode::Angle,
        auto_indent: false,
    };

    let result = export::generate_export_preview(&pool, payload)
        .await
        .expect("Failed to generate preview");

    assert!(
        result.content.contains("|漢字《かんじ》"),
        "Should contain ruby in angle format: {}",
        result.content
    );
}
