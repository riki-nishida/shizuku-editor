use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{Knowledge, KnowledgeOutline, KnowledgeSearchResult};
use crate::repositories::knowledge as repo;

pub async fn get_knowledge(pool: &DbPool, knowledge_id: &str) -> AppResult<Knowledge> {
    repo::find_by_id(pool, knowledge_id).await
}

pub async fn get_knowledge_by_work(
    pool: &DbPool,
    work_id: &str,
) -> AppResult<Vec<KnowledgeOutline>> {
    repo::find_by_work(pool, work_id).await
}

pub async fn create_knowledge(pool: &DbPool, type_id: &str, title: &str) -> AppResult<String> {
    let max_sort_order = repo::find_max_sort_order_by_type(pool, type_id).await?;
    let new_sort_order = max_sort_order.unwrap_or(0) + 1;

    repo::insert(pool, type_id, title, new_sort_order).await
}

pub async fn update_knowledge_title(
    pool: &DbPool,
    knowledge_id: &str,
    title: &str,
) -> AppResult<()> {
    repo::update_title(pool, knowledge_id, title).await
}

pub async fn update_knowledge_body(
    pool: &DbPool,
    knowledge_id: &str,
    body: &str,
    plain_text: &str,
) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    repo::update_body(&mut *tx, knowledge_id, body).await?;

    repo::update_plain_text(&mut *tx, knowledge_id, plain_text).await?;

    tx.commit().await?;
    Ok(())
}

pub async fn update_knowledge_sort_order(
    pool: &DbPool,
    knowledge_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::update_sort_order(pool, knowledge_id, new_sort_order).await
}

pub async fn update_knowledge_type(
    pool: &DbPool,
    knowledge_id: &str,
    type_id: &str,
) -> AppResult<()> {
    repo::update_type(pool, knowledge_id, type_id).await
}

pub async fn get_knowledge_by_type(
    pool: &DbPool,
    type_id: &str,
) -> AppResult<Vec<KnowledgeOutline>> {
    repo::find_by_type(pool, type_id).await
}

pub async fn delete_knowledge(pool: &DbPool, knowledge_id: &str) -> AppResult<()> {
    repo::delete(pool, knowledge_id).await
}

pub async fn search_knowledge(
    pool: &DbPool,
    work_id: &str,
    query: &str,
) -> AppResult<Vec<KnowledgeSearchResult>> {
    repo::search(pool, work_id, query).await
}
