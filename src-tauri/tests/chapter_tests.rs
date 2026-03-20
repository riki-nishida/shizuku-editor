use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{chapter, scene, work};

#[tokio::test]
async fn test_create_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let chapter_outline = chapter::create_chapter(&pool, &work_id, "第一章")
        .await
        .unwrap();

    assert!(!chapter_outline.id.is_empty());
    assert_eq!(chapter_outline.title, "第一章");
    assert_eq!(chapter_outline.word_count, 0);
    assert!(!chapter_outline.is_deleted);
}

#[tokio::test]
async fn test_create_multiple_chapters_increments_sort_order() {
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
    let ch3 = chapter::create_chapter(&pool, &work_id, "第三章")
        .await
        .unwrap();

    assert_eq!(ch1.sort_order, 1);
    assert_eq!(ch2.sort_order, 2);
    assert_eq!(ch3.sort_order, 3);
}

#[tokio::test]
async fn test_update_chapter_title() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let created = chapter::create_chapter(&pool, &work_id, "元のタイトル")
        .await
        .unwrap();

    chapter::update_chapter_title(&pool, &created.id, "新しいタイトル")
        .await
        .unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();
    let updated = outline
        .chapters
        .iter()
        .find(|c| c.id == created.id)
        .unwrap();
    assert_eq!(updated.title, "新しいタイトル");
}

#[tokio::test]
async fn test_update_chapter_sort_order() {
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

    chapter::update_chapter_sort_order(&pool, &ch1.id, 2)
        .await
        .unwrap();
    chapter::update_chapter_sort_order(&pool, &ch2.id, 1)
        .await
        .unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();

    let updated_ch1 = outline.chapters.iter().find(|c| c.id == ch1.id).unwrap();
    let updated_ch2 = outline.chapters.iter().find(|c| c.id == ch2.id).unwrap();

    assert_eq!(updated_ch1.sort_order, 2);
    assert_eq!(updated_ch2.sort_order, 1);
}

#[tokio::test]
async fn test_delete_chapter_soft_deletes_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "削除対象章")
        .await
        .unwrap();

    chapter::delete_chapter(&pool, &ch.id).await.unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();
    let deleted = outline.chapters.iter().find(|c| c.id == ch.id).unwrap();
    assert!(deleted.is_deleted);
}

#[tokio::test]
async fn test_delete_chapter_cascades_to_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let scene1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let scene2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    chapter::delete_chapter(&pool, &ch.id).await.unwrap();

    let deleted_scene1 = scene::get_scene(&pool, &scene1.id).await.unwrap();
    let deleted_scene2 = scene::get_scene(&pool, &scene2.id).await.unwrap();

    assert!(deleted_scene1.is_deleted, "Scene 1 should be soft-deleted");
    assert!(deleted_scene2.is_deleted, "Scene 2 should be soft-deleted");
}

#[tokio::test]
async fn test_delete_chapter_does_not_affect_other_chapters_scenes() {
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

    let scene_ch1 = scene::create_scene(&pool, &ch1.id, "章1のシーン")
        .await
        .unwrap();
    let scene_ch2 = scene::create_scene(&pool, &ch2.id, "章2のシーン")
        .await
        .unwrap();

    chapter::delete_chapter(&pool, &ch1.id).await.unwrap();

    let scene_ch2_after = scene::get_scene(&pool, &scene_ch2.id).await.unwrap();
    assert!(
        !scene_ch2_after.is_deleted,
        "Scene in chapter 2 should not be deleted"
    );

    let scene_ch1_after = scene::get_scene(&pool, &scene_ch1.id).await.unwrap();
    assert!(
        scene_ch1_after.is_deleted,
        "Scene in chapter 1 should be deleted"
    );
}

#[tokio::test]
async fn test_restore_chapter_restores_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "復元対象")
        .await
        .unwrap();

    chapter::delete_chapter(&pool, &ch.id).await.unwrap();
    chapter::restore_chapter(&pool, &ch.id).await.unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();
    let restored = outline.chapters.iter().find(|c| c.id == ch.id).unwrap();
    assert!(!restored.is_deleted);
}

#[tokio::test]
async fn test_restore_chapter_restores_all_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let scene1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let scene2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    chapter::delete_chapter(&pool, &ch.id).await.unwrap();
    chapter::restore_chapter(&pool, &ch.id).await.unwrap();

    let restored_scene1 = scene::get_scene(&pool, &scene1.id).await.unwrap();
    let restored_scene2 = scene::get_scene(&pool, &scene2.id).await.unwrap();

    assert!(!restored_scene1.is_deleted, "Scene 1 should be restored");
    assert!(!restored_scene2.is_deleted, "Scene 2 should be restored");
}

#[tokio::test]
async fn test_restore_chapter_restores_scenes_that_were_individually_deleted() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let scene1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let scene2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    scene::delete_scene(&pool, &scene1.id).await.unwrap();

    chapter::delete_chapter(&pool, &ch.id).await.unwrap();

    chapter::restore_chapter(&pool, &ch.id).await.unwrap();

    let restored_scene1 = scene::get_scene(&pool, &scene1.id).await.unwrap();
    let restored_scene2 = scene::get_scene(&pool, &scene2.id).await.unwrap();

    assert!(!restored_scene1.is_deleted);
    assert!(!restored_scene2.is_deleted);
}

#[tokio::test]
async fn test_permanent_delete_chapter_removes_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "完全削除対象")
        .await
        .unwrap();

    chapter::permanent_delete_chapter(&pool, &ch.id)
        .await
        .unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();
    let found = outline.chapters.iter().find(|c| c.id == ch.id);
    assert!(found.is_none(), "Chapter should be permanently deleted");
}

#[tokio::test]
async fn test_permanent_delete_chapter_removes_all_scenes() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();
    let ch = chapter::create_chapter(&pool, &work_id, "章")
        .await
        .unwrap();

    let scene1 = scene::create_scene(&pool, &ch.id, "シーン1").await.unwrap();
    let scene2 = scene::create_scene(&pool, &ch.id, "シーン2").await.unwrap();

    chapter::permanent_delete_chapter(&pool, &ch.id)
        .await
        .unwrap();

    let result1 = scene::get_scene(&pool, &scene1.id).await;
    let result2 = scene::get_scene(&pool, &scene2.id).await;

    assert!(result1.is_err(), "Scene 1 should be permanently deleted");
    assert!(result2.is_err(), "Scene 2 should be permanently deleted");
}

#[tokio::test]
async fn test_permanent_delete_chapter_does_not_affect_other_chapters() {
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

    let scene_ch2 = scene::create_scene(&pool, &ch2.id, "章2のシーン")
        .await
        .unwrap();

    chapter::permanent_delete_chapter(&pool, &ch1.id)
        .await
        .unwrap();

    let outline = shizuku_editor_lib::services::outline::get_work_outline(&pool, &work_id)
        .await
        .unwrap();
    assert!(outline.chapters.iter().any(|c| c.id == ch2.id));

    let scene_ch2_after = scene::get_scene(&pool, &scene_ch2.id).await;
    assert!(scene_ch2_after.is_ok());
}
