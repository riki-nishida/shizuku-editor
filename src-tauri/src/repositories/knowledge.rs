use sqlx::Executor;
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{Knowledge, KnowledgeOutline, KnowledgeSearchResult};

pub async fn find_by_id(pool: &DbPool, knowledge_id: &str) -> AppResult<Knowledge> {
    let knowledge = sqlx::query_as::<_, Knowledge>(
        r#"
        SELECT
            id, type_id, title, body, plain_text,
            sort_order, created_at, updated_at
        FROM knowledge
        WHERE id = ?
        "#,
    )
    .bind(knowledge_id)
    .fetch_one(pool)
    .await?;

    Ok(knowledge)
}

pub async fn find_by_work(pool: &DbPool, work_id: &str) -> AppResult<Vec<KnowledgeOutline>> {
    let knowledge = sqlx::query_as::<_, KnowledgeOutline>(
        "SELECT k.id, k.type_id, k.title, k.sort_order
         FROM knowledge k
         JOIN knowledge_types kt ON k.type_id = kt.id
         WHERE kt.work_id = ?
         ORDER BY k.sort_order ASC, k.id ASC",
    )
    .bind(work_id)
    .fetch_all(pool)
    .await?;

    Ok(knowledge)
}

pub async fn find_by_type(pool: &DbPool, type_id: &str) -> AppResult<Vec<KnowledgeOutline>> {
    let knowledge = sqlx::query_as::<_, KnowledgeOutline>(
        "SELECT id, type_id, title, sort_order
         FROM knowledge
         WHERE type_id = ?
         ORDER BY sort_order ASC, id ASC",
    )
    .bind(type_id)
    .fetch_all(pool)
    .await?;

    Ok(knowledge)
}

pub async fn find_max_sort_order_by_type(pool: &DbPool, type_id: &str) -> AppResult<Option<i64>> {
    let max_sort_order: Option<i64> =
        sqlx::query_scalar("SELECT MAX(sort_order) FROM knowledge WHERE type_id = ?")
            .bind(type_id)
            .fetch_optional(pool)
            .await?
            .flatten();

    Ok(max_sort_order)
}

pub async fn insert(
    pool: &DbPool,
    type_id: &str,
    title: &str,
    sort_order: i64,
) -> AppResult<String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO knowledge (id, type_id, title, sort_order, plain_text) VALUES (?, ?, ?, ?, '')",
    )
    .bind(&id)
    .bind(type_id)
    .bind(title)
    .bind(sort_order)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn update_title(pool: &DbPool, knowledge_id: &str, title: &str) -> AppResult<()> {
    sqlx::query("UPDATE knowledge SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(title)
        .bind(knowledge_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_body<'e, E>(executor: E, knowledge_id: &str, body: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE knowledge SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(body)
        .bind(knowledge_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn update_plain_text<'e, E>(
    executor: E,
    knowledge_id: &str,
    plain_text: &str,
) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE knowledge SET plain_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(plain_text)
        .bind(knowledge_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn update_sort_order(
    pool: &DbPool,
    knowledge_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    sqlx::query("UPDATE knowledge SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(new_sort_order)
        .bind(knowledge_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_type(pool: &DbPool, knowledge_id: &str, type_id: &str) -> AppResult<()> {
    sqlx::query("UPDATE knowledge SET type_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(type_id)
        .bind(knowledge_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete<'e, E>(executor: E, knowledge_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM knowledge WHERE id = ?")
        .bind(knowledge_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn find_all_by_work(pool: &DbPool, work_id: &str) -> AppResult<Vec<Knowledge>> {
    let knowledge = sqlx::query_as::<_, Knowledge>(
        r#"
        SELECT k.id, k.type_id, k.title, k.body, k.plain_text,
               k.sort_order, k.created_at, k.updated_at
        FROM knowledge k
        JOIN knowledge_types kt ON k.type_id = kt.id
        WHERE kt.work_id = ?
        ORDER BY k.sort_order ASC, k.id ASC
        "#,
    )
    .bind(work_id)
    .fetch_all(pool)
    .await?;

    Ok(knowledge)
}

pub async fn search(
    pool: &DbPool,
    work_id: &str,
    query: &str,
) -> AppResult<Vec<KnowledgeSearchResult>> {
    let pattern = format!("%{}%", query);
    let results = sqlx::query_as::<_, KnowledgeSearchResult>(
        r#"
        SELECT
            k.id,
            k.type_id,
            k.title,
            CASE
                WHEN LOWER(k.plain_text) LIKE LOWER(?) THEN
                    SUBSTR(k.plain_text, MAX(1, INSTR(LOWER(k.plain_text), LOWER(?)) - 20), 80)
                ELSE ''
            END as matched_text
        FROM knowledge k
        JOIN knowledge_types kt ON k.type_id = kt.id
        WHERE kt.work_id = ?
          AND (LOWER(k.plain_text) LIKE LOWER(?) OR LOWER(k.title) LIKE LOWER(?))
        ORDER BY k.sort_order ASC, k.id ASC
        "#,
    )
    .bind(&pattern)
    .bind(query)
    .bind(work_id)
    .bind(&pattern)
    .bind(&pattern)
    .fetch_all(pool)
    .await?;

    Ok(results)
}
