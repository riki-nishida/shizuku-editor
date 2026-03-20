use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::settings::Language;
use crate::models::Work;
use crate::repositories::{
    chapter as chapter_repo, knowledge_type as knowledge_type_repo, work as repo,
};

pub async fn list_works(pool: &DbPool) -> AppResult<Vec<Work>> {
    repo::find_all(pool).await
}

pub async fn create_work(pool: &DbPool, name: &str, language: &Language) -> AppResult<String> {
    let mut tx = pool.begin().await?;

    let work_id = repo::insert_with_executor(&mut *tx, name).await?;

    let (chapter_title, memo_name) = match language {
        Language::En => ("Main", "Memo"),
        Language::Ja => ("本編", "メモ"),
    };

    chapter_repo::insert_with_executor(&mut *tx, &work_id, chapter_title, 0).await?;

    knowledge_type_repo::insert(
        &mut *tx,
        &work_id,
        memo_name,
        Some("#808080"),
        Some("EditPencil"),
        0,
    )
    .await?;

    tx.commit().await?;
    Ok(work_id)
}

pub async fn delete_work(pool: &DbPool, work_id: &str) -> AppResult<()> {
    repo::delete(pool, work_id).await
}

pub async fn update_work_name(pool: &DbPool, work_id: &str, name: &str) -> AppResult<()> {
    repo::update_name(pool, work_id, name).await
}

pub async fn get_work(pool: &DbPool, work_id: &str) -> AppResult<Work> {
    repo::find_by_id(pool, work_id).await
}

pub async fn get_chapter_count(pool: &DbPool, work_id: &str) -> AppResult<i64> {
    chapter_repo::count_active(pool, work_id).await
}
