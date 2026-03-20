use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{knowledge_type, outline, work};

#[tokio::test]
async fn test_create_and_list_works() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let works = work::list_works(&pool).await.expect("Failed to list works");
    assert!(works.is_empty(), "Expected no works initially");

    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .expect("Failed to create work");
    assert!(!work_id.is_empty(), "Work ID should not be empty");

    let works = work::list_works(&pool).await.expect("Failed to list works");
    assert_eq!(works.len(), 1, "Expected 1 work");
    assert_eq!(works[0].name, "テスト作品");
    assert_eq!(works[0].id, work_id);
}

#[tokio::test]
async fn test_update_work_name() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let work_id = work::create_work(&pool, "元の名前", &Language::Ja)
        .await
        .expect("Failed to create work");

    work::update_work_name(&pool, &work_id, "新しい名前")
        .await
        .expect("Failed to update work name");

    let works = work::list_works(&pool).await.expect("Failed to list works");
    assert_eq!(works[0].name, "新しい名前");
}

#[tokio::test]
async fn test_delete_work() {
    let pool = create_test_pool_empty()
        .await
        .expect("Failed to create test pool");

    let work_id = work::create_work(&pool, "削除予定", &Language::Ja)
        .await
        .expect("Failed to create work");

    work::delete_work(&pool, &work_id)
        .await
        .expect("Failed to delete work");

    let works = work::list_works(&pool).await.expect("Failed to list works");
    assert!(works.is_empty(), "Expected no works after deletion");
}

#[tokio::test]
async fn test_get_work() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let fetched = work::get_work(&pool, &work_id).await.unwrap();

    assert_eq!(fetched.id, work_id);
    assert_eq!(fetched.name, "テスト作品");
}

#[tokio::test]
async fn test_get_work_not_found() {
    let pool = create_test_pool_empty().await.unwrap();

    let result = work::get_work(&pool, "nonexistent-id").await;

    assert!(result.is_err());
}

#[tokio::test]
async fn test_get_chapter_count_default() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let count = work::get_chapter_count(&pool, &work_id).await.unwrap();

    assert_eq!(count, 1);
}

#[tokio::test]
async fn test_create_work_creates_default_chapter() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let work_outline = outline::get_work_outline(&pool, &work_id).await.unwrap();

    assert_eq!(work_outline.chapters.len(), 1);
    assert_eq!(work_outline.chapters[0].title, "本編");
}

#[tokio::test]
async fn test_create_work_creates_default_knowledge_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(types.len(), 1);
    assert_eq!(types[0].name, "メモ");
}

#[tokio::test]
async fn test_create_multiple_works() {
    let pool = create_test_pool_empty().await.unwrap();

    let id1 = work::create_work(&pool, "作品1", &Language::Ja)
        .await
        .unwrap();
    let id2 = work::create_work(&pool, "作品2", &Language::Ja)
        .await
        .unwrap();
    let id3 = work::create_work(&pool, "作品3", &Language::Ja)
        .await
        .unwrap();

    assert_ne!(id1, id2);
    assert_ne!(id2, id3);

    let works = work::list_works(&pool).await.unwrap();
    assert_eq!(works.len(), 3);
}

#[tokio::test]
async fn test_delete_work_does_not_affect_other_works() {
    let pool = create_test_pool_empty().await.unwrap();

    let id1 = work::create_work(&pool, "作品1", &Language::Ja)
        .await
        .unwrap();
    let id2 = work::create_work(&pool, "作品2", &Language::Ja)
        .await
        .unwrap();

    work::delete_work(&pool, &id1).await.unwrap();

    let works = work::list_works(&pool).await.unwrap();
    assert_eq!(works.len(), 1);
    assert_eq!(works[0].id, id2);
    assert_eq!(works[0].name, "作品2");
}
