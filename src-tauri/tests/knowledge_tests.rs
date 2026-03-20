use shizuku_editor_lib::db::test_utils::create_test_pool_empty;
use shizuku_editor_lib::models::settings::Language;
use shizuku_editor_lib::services::{knowledge, knowledge_type, work};

#[tokio::test]
async fn test_create_knowledge() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let knowledge_id = knowledge::create_knowledge(&pool, &memo_type.id, "キャラクター設定")
        .await
        .unwrap();

    assert!(!knowledge_id.is_empty());

    let fetched = knowledge::get_knowledge(&pool, &knowledge_id)
        .await
        .unwrap();
    assert_eq!(fetched.title, "キャラクター設定");
    assert_eq!(fetched.type_id, memo_type.id);
    assert_eq!(fetched.body, "");
}

#[tokio::test]
async fn test_create_multiple_knowledge_increments_sort_order() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let k1 = knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ1")
        .await
        .unwrap();
    let k2 = knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ2")
        .await
        .unwrap();
    let k3 = knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ3")
        .await
        .unwrap();

    let fetched1 = knowledge::get_knowledge(&pool, &k1).await.unwrap();
    let fetched2 = knowledge::get_knowledge(&pool, &k2).await.unwrap();
    let fetched3 = knowledge::get_knowledge(&pool, &k3).await.unwrap();

    assert_eq!(fetched1.sort_order, 1);
    assert_eq!(fetched2.sort_order, 2);
    assert_eq!(fetched3.sort_order, 3);
}

#[tokio::test]
async fn test_get_knowledge_by_work() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ1")
        .await
        .unwrap();
    knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ2")
        .await
        .unwrap();

    let list = knowledge::get_knowledge_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(list.len(), 2);
    assert_eq!(list[0].title, "ナレッジ1");
    assert_eq!(list[1].title, "ナレッジ2");
}

#[tokio::test]
async fn test_update_knowledge_title() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let k_id = knowledge::create_knowledge(&pool, &memo_type.id, "元のタイトル")
        .await
        .unwrap();

    knowledge::update_knowledge_title(&pool, &k_id, "新しいタイトル")
        .await
        .unwrap();

    let updated = knowledge::get_knowledge(&pool, &k_id).await.unwrap();
    assert_eq!(updated.title, "新しいタイトル");
}

#[tokio::test]
async fn test_update_knowledge_body() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let k_id = knowledge::create_knowledge(&pool, &memo_type.id, "本文テスト")
        .await
        .unwrap();

    knowledge::update_knowledge_body(
        &pool,
        &k_id,
        "これは本文です。詳細な設定を記述します。",
        "これは本文です。詳細な設定を記述します。",
    )
    .await
    .unwrap();

    let updated = knowledge::get_knowledge(&pool, &k_id).await.unwrap();
    assert_eq!(updated.body, "これは本文です。詳細な設定を記述します。");
}

#[tokio::test]
async fn test_update_knowledge_sort_order() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let k1 = knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ1")
        .await
        .unwrap();
    let k2 = knowledge::create_knowledge(&pool, &memo_type.id, "ナレッジ2")
        .await
        .unwrap();

    knowledge::update_knowledge_sort_order(&pool, &k1, 2)
        .await
        .unwrap();
    knowledge::update_knowledge_sort_order(&pool, &k2, 1)
        .await
        .unwrap();

    let list = knowledge::get_knowledge_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(list[0].id, k2);
    assert_eq!(list[1].id, k1);
}

#[tokio::test]
async fn test_delete_knowledge() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let memo_type = types.iter().find(|t| t.name == "メモ").unwrap();

    let k_id = knowledge::create_knowledge(&pool, &memo_type.id, "削除対象")
        .await
        .unwrap();

    knowledge::delete_knowledge(&pool, &k_id).await.unwrap();

    let list = knowledge::get_knowledge_by_work(&pool, &work_id)
        .await
        .unwrap();
    assert!(list.is_empty());

    let result = knowledge::get_knowledge(&pool, &k_id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_create_knowledge_with_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type_id = knowledge_type::create_knowledge_type(
        &pool,
        &work_id,
        "カスタムタイプ",
        Some("#FF5733"),
        None,
    )
    .await
    .unwrap();

    let k_id = knowledge::create_knowledge(&pool, &type_id, "タイプ付きナレッジ")
        .await
        .unwrap();

    let fetched = knowledge::get_knowledge(&pool, &k_id).await.unwrap();
    assert_eq!(fetched.type_id, type_id);
}

#[tokio::test]
async fn test_update_knowledge_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type1 =
        knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ1", Some("#FF5733"), None)
            .await
            .unwrap();
    let type2 =
        knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ2", Some("#33FF57"), None)
            .await
            .unwrap();

    let k_id = knowledge::create_knowledge(&pool, &type1, "ナレッジ")
        .await
        .unwrap();

    knowledge::update_knowledge_type(&pool, &k_id, &type2)
        .await
        .unwrap();

    let updated = knowledge::get_knowledge(&pool, &k_id).await.unwrap();
    assert_eq!(updated.type_id, type2);
}

#[tokio::test]
async fn test_get_knowledge_by_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type1 =
        knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ1", Some("#FF5733"), None)
            .await
            .unwrap();
    let type2 =
        knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ2", Some("#33FF57"), None)
            .await
            .unwrap();

    knowledge::create_knowledge(&pool, &type1, "タイプ1ナレッジ1")
        .await
        .unwrap();
    knowledge::create_knowledge(&pool, &type1, "タイプ1ナレッジ2")
        .await
        .unwrap();
    knowledge::create_knowledge(&pool, &type2, "タイプ2ナレッジ")
        .await
        .unwrap();

    let type1_list = knowledge::get_knowledge_by_type(&pool, &type1)
        .await
        .unwrap();
    let type2_list = knowledge::get_knowledge_by_type(&pool, &type2)
        .await
        .unwrap();

    assert_eq!(type1_list.len(), 2);
    assert_eq!(type2_list.len(), 1);
}

#[tokio::test]
async fn test_create_knowledge_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type_id =
        knowledge_type::create_knowledge_type(&pool, &work_id, "登場人物", Some("#FF5733"), None)
            .await
            .unwrap();

    assert!(!type_id.is_empty());

    let fetched = knowledge_type::get_knowledge_type(&pool, &type_id)
        .await
        .unwrap();
    assert_eq!(fetched.name, "登場人物");
    assert_eq!(fetched.color, Some("#FF5733".to_string()));
}

#[tokio::test]
async fn test_create_knowledge_type_default_color() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type_id =
        knowledge_type::create_knowledge_type(&pool, &work_id, "色なしタイプ", None, None)
            .await
            .unwrap();

    let fetched = knowledge_type::get_knowledge_type(&pool, &type_id)
        .await
        .unwrap();
    assert_eq!(fetched.color, Some("#FFB74D".to_string()));
}

#[tokio::test]
async fn test_get_knowledge_types_by_work() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let initial_types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let initial_count = initial_types.len();

    knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ1", Some("#FF5733"), None)
        .await
        .unwrap();
    knowledge_type::create_knowledge_type(&pool, &work_id, "タイプ2", Some("#33FF57"), None)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(types.len(), initial_count + 2);
}

#[tokio::test]
async fn test_update_knowledge_type_name_and_color() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let type_id =
        knowledge_type::create_knowledge_type(&pool, &work_id, "元の名前", Some("#FF5733"), None)
            .await
            .unwrap();

    knowledge_type::update_knowledge_type(
        &pool,
        &type_id,
        Some("新しい名前"),
        Some("#00FF00"),
        None,
        None,
    )
    .await
    .unwrap();

    let updated = knowledge_type::get_knowledge_type(&pool, &type_id)
        .await
        .unwrap();
    assert_eq!(updated.name, "新しい名前");
    assert_eq!(updated.color, Some("#00FF00".to_string()));
}

#[tokio::test]
async fn test_delete_knowledge_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    let initial_types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    let initial_count = initial_types.len();

    let type_id =
        knowledge_type::create_knowledge_type(&pool, &work_id, "削除対象", Some("#FF5733"), None)
            .await
            .unwrap();

    knowledge_type::delete_knowledge_type(&pool, &type_id)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();
    assert_eq!(types.len(), initial_count);
    assert!(!types.iter().any(|t| t.id == type_id));
}

#[tokio::test]
async fn test_ensure_default_types_creates_default_type() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    knowledge_type::ensure_default_types(&pool, &work_id, &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(types.len(), 1);
    assert_eq!(types[0].name, "メモ");
}

#[tokio::test]
async fn test_ensure_default_types_is_idempotent() {
    let pool = create_test_pool_empty().await.unwrap();
    let work_id = work::create_work(&pool, "テスト作品", &Language::Ja)
        .await
        .unwrap();

    knowledge_type::ensure_default_types(&pool, &work_id, &Language::Ja)
        .await
        .unwrap();
    knowledge_type::ensure_default_types(&pool, &work_id, &Language::Ja)
        .await
        .unwrap();

    let types = knowledge_type::get_knowledge_types_by_work(&pool, &work_id)
        .await
        .unwrap();

    assert_eq!(types.len(), 1);
}
