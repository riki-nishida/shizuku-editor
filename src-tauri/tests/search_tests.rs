use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{chapter, scene, search, work};

#[tokio::test]
async fn test_search_project_empty_query_returns_empty() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 0);
    assert_eq!(result.total_scenes, 0);
    assert!(result.matches.is_empty());
}

#[tokio::test]
async fn test_search_project_no_matches() {
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

    scene::update_scene_content(&pool, &scene1.id, "これはテストです", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "見つからない", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 0);
    assert_eq!(result.total_scenes, 0);
}

#[tokio::test]
async fn test_search_project_finds_single_match() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使いが現れた", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 1);
    assert_eq!(result.total_scenes, 1);
    assert_eq!(result.matches[0].scene_id, scene1.id);
    assert_eq!(result.matches[0].line_number, 1);
}

#[tokio::test]
async fn test_search_project_finds_multiple_matches_in_single_scene() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使いの魔法は強力な魔法だ", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 3);
    assert_eq!(result.total_scenes, 1);
}

#[tokio::test]
async fn test_search_project_finds_matches_across_scenes() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使いが現れた", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &scene2.id, "魔法の力で戦う", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 2);
    assert_eq!(result.total_scenes, 2);
}

#[tokio::test]
async fn test_search_project_case_insensitive() {
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

    scene::update_scene_content(&pool, &scene1.id, "Hello World", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "hello", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 1);
}

#[tokio::test]
async fn test_search_project_case_sensitive() {
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

    scene::update_scene_content(&pool, &scene1.id, "Hello World", "[]")
        .await
        .unwrap();

    let result = search::search_project(&pool, &work_id, "hello", true)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 0);

    let result = search::search_project(&pool, &work_id, "Hello", true)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 1);
}

#[tokio::test]
async fn test_search_project_multiline() {
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

    scene::update_scene_content(
        &pool,
        &scene1.id,
        "一行目に魔法\n二行目にも魔法\n三行目は普通",
        "[]",
    )
    .await
    .unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 2);
    assert_eq!(result.matches[0].line_number, 1);
    assert_eq!(result.matches[1].line_number, 2);
}

#[tokio::test]
async fn test_search_project_excludes_deleted_scenes() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使い", "[]")
        .await
        .unwrap();
    scene::delete_scene(&pool, &scene1.id).await.unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 0);
}

#[tokio::test]
async fn test_search_project_excludes_deleted_chapters() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使い", "[]")
        .await
        .unwrap();
    chapter::delete_chapter(&pool, &chapter.id).await.unwrap();

    let result = search::search_project(&pool, &work_id, "魔法", false)
        .await
        .unwrap();

    assert_eq!(result.total_matches, 0);
}

#[tokio::test]
async fn test_replace_empty_search_returns_zero() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "", "置換後", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 0);
    assert_eq!(result.affected_scenes, 0);
}

#[tokio::test]
async fn test_replace_single_occurrence() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使い", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "魔法", "呪文", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 1);
    assert_eq!(result.affected_scenes, 1);

    let updated = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(updated.content_text, "呪文使い");
}

#[tokio::test]
async fn test_replace_multiple_occurrences() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法と魔法", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "魔法", "呪文", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 2);
    assert_eq!(result.affected_scenes, 1);

    let updated = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(updated.content_text, "呪文と呪文");
}

#[tokio::test]
async fn test_replace_across_scenes() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使い", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &scene2.id, "魔法の国", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "魔法", "呪文", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 2);
    assert_eq!(result.affected_scenes, 2);
}

#[tokio::test]
async fn test_replace_specific_scenes_only() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法使い", "[]")
        .await
        .unwrap();
    scene::update_scene_content(&pool, &scene2.id, "魔法の国", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(
        &pool,
        &work_id,
        "魔法",
        "呪文",
        false,
        Some(vec![scene1.id.clone()]),
    )
    .await
    .unwrap();

    assert_eq!(result.replaced_count, 1);
    assert_eq!(result.affected_scenes, 1);

    let updated1 = scene::get_scene(&pool, &scene1.id).await.unwrap();
    let updated2 = scene::get_scene(&pool, &scene2.id).await.unwrap();
    assert_eq!(updated1.content_text, "呪文使い");
    assert_eq!(updated2.content_text, "魔法の国");
}

#[tokio::test]
async fn test_replace_updates_word_count() {
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

    scene::update_scene_content(&pool, &scene1.id, "あいう", "[]")
        .await
        .unwrap();

    let before = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(before.word_count, 3);

    search::replace_in_project(&pool, &work_id, "あいう", "かきくけこ", false, None)
        .await
        .unwrap();

    let after = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(after.word_count, 5);
    assert_eq!(after.content_text, "かきくけこ");
}

#[tokio::test]
async fn test_replace_case_sensitive() {
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

    scene::update_scene_content(&pool, &scene1.id, "Hello hello HELLO", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "Hello", "Hi", true, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 1);

    let updated = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(updated.content_text, "Hi hello HELLO");
}

#[tokio::test]
async fn test_replace_case_insensitive() {
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

    scene::update_scene_content(&pool, &scene1.id, "Hello hello HELLO", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "hello", "hi", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 3);

    let updated = scene::get_scene(&pool, &scene1.id).await.unwrap();
    assert_eq!(updated.content_text, "hi hi hi");
}

#[tokio::test]
async fn test_replace_empty_scene_ids_returns_zero() {
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

    scene::update_scene_content(&pool, &scene1.id, "魔法", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "魔法", "呪文", false, Some(vec![]))
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 0);
    assert_eq!(result.affected_scenes, 0);
}

#[tokio::test]
async fn test_replace_no_match_returns_zero() {
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

    scene::update_scene_content(&pool, &scene1.id, "テスト", "[]")
        .await
        .unwrap();

    let result = search::replace_in_project(&pool, &work_id, "見つからない", "置換", false, None)
        .await
        .unwrap();

    assert_eq!(result.replaced_count, 0);
    assert_eq!(result.affected_scenes, 0);
}
