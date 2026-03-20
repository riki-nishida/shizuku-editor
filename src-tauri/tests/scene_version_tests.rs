use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{chapter, scene, scene_version, work};

#[tokio::test]
async fn test_create_version() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "これはテストです。", "[]")
        .await
        .unwrap();

    let version = scene_version::create_version(&pool, &scene_outline.id, Some("初稿".to_string()))
        .await
        .unwrap();

    assert!(!version.id.is_empty());
    assert_eq!(version.scene_id, scene_outline.id);
    assert_eq!(version.content_text, "これはテストです。");
    assert_eq!(version.content_markups, "[]");
    assert_eq!(version.label, Some("初稿".to_string()));
}

#[tokio::test]
async fn test_create_version_without_label() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    assert_eq!(version.label, Some("".to_string()));
}

#[tokio::test]
async fn test_get_versions() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "内容1", "[]")
        .await
        .unwrap();
    scene_version::create_version(&pool, &scene_outline.id, Some("v1".to_string()))
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "内容2", "[]")
        .await
        .unwrap();
    scene_version::create_version(&pool, &scene_outline.id, Some("v2".to_string()))
        .await
        .unwrap();

    let versions = scene_version::get_versions(&pool, &scene_outline.id)
        .await
        .unwrap();

    assert_eq!(versions.len(), 2);
    let labels: Vec<_> = versions.iter().filter_map(|v| v.label.clone()).collect();
    assert!(labels.contains(&"v1".to_string()));
    assert!(labels.contains(&"v2".to_string()));
}

#[tokio::test]
async fn test_get_version() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "取得テスト", "[]")
        .await
        .unwrap();
    let created = scene_version::create_version(&pool, &scene_outline.id, Some("test".to_string()))
        .await
        .unwrap();

    let fetched = scene_version::get_version(&pool, &created.id)
        .await
        .unwrap();

    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.content_text, "取得テスト");
}

#[tokio::test]
async fn test_restore_version() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "元の内容です", "[]")
        .await
        .unwrap();
    let version = scene_version::create_version(&pool, &scene_outline.id, Some("保存".to_string()))
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "新しい内容です", "[]")
        .await
        .unwrap();

    let before_restore = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(before_restore.content_text, "新しい内容です");

    let restored = scene_version::restore_version(&pool, &version.id, Some("Before restore"))
        .await
        .unwrap();
    assert!(restored);

    let after_restore = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(after_restore.content_text, "元の内容です");
}

#[tokio::test]
async fn test_restore_version_same_content_returns_false() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "同じ内容です", "[]")
        .await
        .unwrap();
    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    let restored = scene_version::restore_version(&pool, &version.id, Some("Before restore"))
        .await
        .unwrap();
    assert!(!restored);

    let scene = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(scene.content_text, "同じ内容です");
}

#[tokio::test]
async fn test_restore_version_updates_word_count() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "あいうえお", "[]")
        .await
        .unwrap();
    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "かきくけこさしすせそ", "[]")
        .await
        .unwrap();
    let before = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(before.word_count, 10);

    scene_version::restore_version(&pool, &version.id, Some("Before restore"))
        .await
        .unwrap();

    let after = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(after.word_count, 5);
}

#[tokio::test]
async fn test_restore_version_with_markups() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
    scene::update_scene_content(&pool, &scene_outline.id, "漢字のテスト", markups)
        .await
        .unwrap();
    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene_outline.id, "別の内容", "[]")
        .await
        .unwrap();

    scene_version::restore_version(&pool, &version.id, Some("Before restore"))
        .await
        .unwrap();

    let restored = scene::get_scene(&pool, &scene_outline.id).await.unwrap();
    assert_eq!(restored.content_text, "漢字のテスト");
    assert_eq!(restored.content_markups, markups);
}

#[tokio::test]
async fn test_delete_version() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    let version =
        scene_version::create_version(&pool, &scene_outline.id, Some("削除対象".to_string()))
            .await
            .unwrap();

    scene_version::delete_version(&pool, &version.id)
        .await
        .unwrap();

    let result = scene_version::get_version(&pool, &version.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_versions_deleted_when_scene_deleted() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "テストシーン")
        .await
        .unwrap();

    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    scene::permanent_delete_scene(&pool, &scene_outline.id)
        .await
        .unwrap();

    let result = scene_version::get_version(&pool, &version.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_create_version_from_empty_scene() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene_outline = scene::create_scene(&pool, &chapter.id, "空のシーン")
        .await
        .unwrap();

    let version = scene_version::create_version(&pool, &scene_outline.id, None)
        .await
        .unwrap();

    assert_eq!(version.content_text, "");
    assert_eq!(version.content_markups, "[]");
}
