use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{chapter, outline, scene, work};

#[tokio::test]
async fn test_get_work_outline_returns_chapters_and_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch1 = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let ch2 = chapter::create_chapter(&pool, &work_id, "第二章")
        .await
        .unwrap();

    scene::create_scene(&pool, &ch1.id, "シーン1-1")
        .await
        .unwrap();
    scene::create_scene(&pool, &ch1.id, "シーン1-2")
        .await
        .unwrap();
    scene::create_scene(&pool, &ch2.id, "シーン2-1")
        .await
        .unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    assert_eq!(result.chapters.len(), 3);
    assert_eq!(result.scenes.len(), 3);
}

#[tokio::test]
async fn test_get_work_outline_chapters_sorted_by_sort_order() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch1 = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();
    let ch2 = chapter::create_chapter(&pool, &work_id, "第二章")
        .await
        .unwrap();

    chapter::update_chapter_sort_order(&pool, &ch1.id, 20)
        .await
        .unwrap();
    chapter::update_chapter_sort_order(&pool, &ch2.id, 10)
        .await
        .unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    assert_eq!(result.chapters.len(), 3);
    assert_eq!(result.chapters[1].id, ch2.id);
    assert_eq!(result.chapters[2].id, ch1.id);
}

#[tokio::test]
async fn test_get_work_outline_scenes_sorted_by_sort_order() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();
    let s3 = scene::create_scene(&pool, &ch.id, "シーン3").await.unwrap();

    scene::update_scene_sort_order(&pool, &s3.id, 1)
        .await
        .unwrap();
    scene::update_scene_sort_order(&pool, &s1.id, 2)
        .await
        .unwrap();
    scene::update_scene_sort_order(&pool, &s2.id, 3)
        .await
        .unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    assert_eq!(result.scenes[0].id, s3.id);
    assert_eq!(result.scenes[1].id, s1.id);
    assert_eq!(result.scenes[2].id, s2.id);
}

#[tokio::test]
async fn test_get_work_outline_includes_deleted_items() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();
    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::delete_scene(&pool, &s1.id).await.unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    assert_eq!(result.scenes.len(), 2);

    let deleted = result.scenes.iter().find(|s| s.id == s1.id).unwrap();
    let active = result.scenes.iter().find(|s| s.id == s2.id).unwrap();

    assert!(deleted.is_deleted);
    assert!(!active.is_deleted);
}

#[tokio::test]
async fn test_get_work_outline_chapter_word_count_aggregates_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::update_scene_content(&pool, &s1.id, "あいうえお", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &s2.id, "かきくけこさし", "[]")
        .await
        .unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    let chapter = result.chapters.iter().find(|c| c.id == ch.id).unwrap();
    assert_eq!(chapter.word_count, 12);
}

#[tokio::test]
async fn test_get_work_outline_chapter_word_count_excludes_deleted_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::update_scene_content(&pool, &s1.id, "あいうえお", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &s2.id, "かきくけこ", "[]")
        .await
        .unwrap();

    scene::delete_scene(&pool, &s2.id).await.unwrap();

    let result = outline::get_work_outline(&pool, &work_id).await.unwrap();

    let chapter = result.chapters.iter().find(|c| c.id == ch.id).unwrap();
    assert_eq!(chapter.word_count, 5);
}

#[tokio::test]
async fn test_get_work_statistics_total_word_count() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::update_scene_content(&pool, &s1.id, "あいうえお", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &s2.id, "かきくけこさしす", "[]")
        .await
        .unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.total_word_count, 13);
}

#[tokio::test]
async fn test_get_work_statistics_excludes_deleted_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let s2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::update_scene_content(&pool, &s1.id, "あいうえお", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &s2.id, "かきくけこ", "[]")
        .await
        .unwrap();

    scene::delete_scene(&pool, &s2.id).await.unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.total_word_count, 5);
}

#[tokio::test]
async fn test_get_work_statistics_excludes_scenes_in_deleted_chapters() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch1 = chapter::create_chapter(&pool, &work_id, "章1")
        .await
        .unwrap();
    let ch2 = chapter::create_chapter(&pool, &work_id, "章2")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch1.id, "シーン1")
        .await
        .unwrap();
    let s2 = scene::create_scene(&pool, &ch2.id, "シーン2")
        .await
        .unwrap();

    scene::update_scene_content(&pool, &s1.id, "あいうえお", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &s2.id, "かきくけこ", "[]")
        .await
        .unwrap();

    chapter::delete_chapter(&pool, &ch2.id).await.unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.total_word_count, 5);
}

#[tokio::test]
async fn test_get_work_statistics_scene_count() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch1 = chapter::create_chapter(&pool, &work_id, "章1")
        .await
        .unwrap();
    let ch2 = chapter::create_chapter(&pool, &work_id, "章2")
        .await
        .unwrap();

    scene::create_scene(&pool, &ch1.id, "シーン1-1")
        .await
        .unwrap();
    scene::create_scene(&pool, &ch1.id, "シーン1-2")
        .await
        .unwrap();
    scene::create_scene(&pool, &ch2.id, "シーン2-1")
        .await
        .unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.scene_count, 3);
}

#[tokio::test]
async fn test_get_work_statistics_scene_count_excludes_deleted() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let s1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::delete_scene(&pool, &s1.id).await.unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.scene_count, 1);
}

#[tokio::test]
async fn test_get_work_statistics_chapter_count() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    chapter::create_chapter(&pool, &work_id, "章1")
        .await
        .unwrap();
    chapter::create_chapter(&pool, &work_id, "章2")
        .await
        .unwrap();
    chapter::create_chapter(&pool, &work_id, "章3")
        .await
        .unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.chapter_count, 4);
}

#[tokio::test]
async fn test_get_work_statistics_chapter_count_excludes_deleted() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let ch1 = chapter::create_chapter(&pool, &work_id, "章1")
        .await
        .unwrap();
    chapter::create_chapter(&pool, &work_id, "章2")
        .await
        .unwrap();

    chapter::delete_chapter(&pool, &ch1.id).await.unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.chapter_count, 2);
}

#[tokio::test]
async fn test_get_work_statistics_empty_work() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "空の作品", &Language::Ja)
        .await
        .unwrap();

    let stats = outline::get_work_statistics(&pool, &work_id).await.unwrap();

    assert_eq!(stats.total_word_count, 0);
    assert_eq!(stats.scene_count, 0);
    assert_eq!(stats.chapter_count, 1);
}
