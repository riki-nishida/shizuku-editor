use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{chapter, scene, work};

#[tokio::test]
async fn test_create_scene() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();

    let scene_outline = scene::create_scene(&pool, &chapter.id, "シーン1")
        .await
        .unwrap();

    assert!(!scene_outline.id.is_empty());
    assert_eq!(scene_outline.title, "シーン1");
    assert_eq!(scene_outline.chapter_id, chapter.id);
    assert_eq!(scene_outline.word_count, 0);
    assert!(!scene_outline.is_deleted);
}

#[tokio::test]
async fn test_create_multiple_scenes_increments_sort_order() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();

    let scene1 = scene::create_scene(&pool, &chapter.id, "シーン1")
        .await
        .unwrap();
    let scene2 = scene::create_scene(&pool, &chapter.id, "シーン2")
        .await
        .unwrap();
    let scene3 = scene::create_scene(&pool, &chapter.id, "シーン3")
        .await
        .unwrap();

    assert_eq!(scene1.sort_order, 1);
    assert_eq!(scene2.sort_order, 2);
    assert_eq!(scene3.sort_order, 3);
}

#[tokio::test]
async fn test_get_scene() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "取得テスト")
        .await
        .unwrap();

    let fetched = scene::get_scene(&pool, &created.id).await.unwrap();

    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.title, "取得テスト");
    assert_eq!(fetched.content_text, "");
    assert_eq!(fetched.word_count, 0);
}

#[tokio::test]
async fn test_get_scenes_by_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();

    scene::create_scene(&pool, &chapter.id, "シーン1")
        .await
        .unwrap();
    scene::create_scene(&pool, &chapter.id, "シーン2")
        .await
        .unwrap();

    let scenes = scene::get_scenes_by_chapter(&pool, &chapter.id)
        .await
        .unwrap();

    assert_eq!(scenes.len(), 2);
    assert_eq!(scenes[0].title, "シーン1");
    assert_eq!(scenes[1].title, "シーン2");
}

#[tokio::test]
async fn test_update_scene_title() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "元のタイトル")
        .await
        .unwrap();

    scene::update_scene_title(&pool, &created.id, "新しいタイトル")
        .await
        .unwrap();

    let updated = scene::get_scene(&pool, &created.id).await.unwrap();
    assert_eq!(updated.title, "新しいタイトル");
}

#[tokio::test]
async fn test_update_scene_content_calculates_word_count() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "本文テスト")
        .await
        .unwrap();

    let content_text = "これはテストです。";
    scene::update_scene_content(&pool, &created.id, content_text, "[]")
        .await
        .unwrap();

    let updated = scene::get_scene(&pool, &created.id).await.unwrap();
    assert_eq!(updated.content_text, content_text);
    assert_eq!(updated.word_count, 9);
}

#[tokio::test]
async fn test_update_scene_content_word_count_excludes_whitespace() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "空白テスト")
        .await
        .unwrap();

    let content_text = "あいう えお\nかきく";
    scene::update_scene_content(&pool, &created.id, content_text, "[]")
        .await
        .unwrap();

    let updated = scene::get_scene(&pool, &created.id).await.unwrap();
    assert_eq!(updated.word_count, 8);
}

#[tokio::test]
async fn test_delete_scene_soft_deletes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "削除テスト")
        .await
        .unwrap();

    scene::delete_scene(&pool, &created.id).await.unwrap();

    let deleted = scene::get_scene(&pool, &created.id).await.unwrap();
    assert!(deleted.is_deleted);
}

#[tokio::test]
async fn test_restore_scene() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "復元テスト")
        .await
        .unwrap();

    scene::delete_scene(&pool, &created.id).await.unwrap();
    scene::restore_scene(&pool, &created.id).await.unwrap();

    let restored = scene::get_scene(&pool, &created.id).await.unwrap();
    assert!(!restored.is_deleted);
}

#[tokio::test]
async fn test_permanent_delete_scene() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let created = scene::create_scene(&pool, &chapter.id, "完全削除")
        .await
        .unwrap();

    scene::permanent_delete_scene(&pool, &created.id)
        .await
        .unwrap();

    let result = scene::get_scene(&pool, &created.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_search_scenes_finds_by_title() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();

    scene::create_scene(&pool, &chapter.id, "魔法の森")
        .await
        .unwrap();
    scene::create_scene(&pool, &chapter.id, "静かな海")
        .await
        .unwrap();

    let results = scene::search_scenes(&pool, &work_id, "魔法").await.unwrap();

    assert_eq!(results.len(), 1);
    assert_eq!(results[0].title, "魔法の森");
}

#[tokio::test]
async fn test_search_scenes_finds_by_body() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene1 = scene::create_scene(&pool, &chapter.id, "シーン1")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &scene1.id, "古代の魔法使いが現れた", "[]")
        .await
        .unwrap();

    let results = scene::search_scenes(&pool, &work_id, "魔法使い")
        .await
        .unwrap();

    assert_eq!(results.len(), 1);
}

#[tokio::test]
async fn test_search_scenes_excludes_deleted() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let scene1 = scene::create_scene(&pool, &chapter.id, "検索対象")
        .await
        .unwrap();

    scene::delete_scene(&pool, &scene1.id).await.unwrap();

    let results = scene::search_scenes(&pool, &work_id, "検索").await.unwrap();
    assert!(results.is_empty());
}

#[tokio::test]
async fn test_move_scene_to_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let chapter1 = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let chapter2 = chapter::create_chapter(&pool, &work_id, "第二章")
        .await
        .unwrap();
    let scene1 = scene::create_scene(&pool, &chapter1.id, "移動シーン")
        .await
        .unwrap();

    scene::move_scene_to_chapter(&pool, &scene1.id, &chapter2.id, 1)
        .await
        .unwrap();

    let moved = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(moved.chapter_id, chapter2.id);
    assert_eq!(moved.sort_order, 1);
}
