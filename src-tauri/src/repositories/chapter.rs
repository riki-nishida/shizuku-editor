use sqlx::Executor;
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;

pub async fn find_max_sort_order(pool: &DbPool, work_id: &str) -> AppResult<Option<i64>> {
    let max_sort_order: Option<i64> = sqlx::query_scalar(
        "SELECT MAX(sort_order) FROM chapters WHERE work_id = ? AND is_deleted = 0",
    )
    .bind(work_id)
    .fetch_optional(pool)
    .await?
    .flatten();

    Ok(max_sort_order)
}

pub async fn count_active(pool: &DbPool, work_id: &str) -> AppResult<i64> {
    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM chapters WHERE work_id = ? AND is_deleted = 0")
            .bind(work_id)
            .fetch_one(pool)
            .await?;

    Ok(count)
}

pub async fn insert(
    pool: &DbPool,
    work_id: &str,
    title: &str,
    sort_order: i64,
) -> AppResult<String> {
    insert_with_executor(pool, work_id, title, sort_order).await
}

pub async fn insert_with_executor<'e, E>(
    executor: E,
    work_id: &str,
    title: &str,
    sort_order: i64,
) -> AppResult<String>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO chapters (id, work_id, title, sort_order, is_deleted) VALUES (?, ?, ?, ?, 0)",
    )
    .bind(&id)
    .bind(work_id)
    .bind(title)
    .bind(sort_order)
    .execute(executor)
    .await?;

    Ok(id)
}

pub async fn find_max_sort_order_with_executor<'e, E>(
    executor: E,
    work_id: &str,
) -> AppResult<Option<i64>>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    let max_sort_order: Option<i64> = sqlx::query_scalar(
        "SELECT MAX(sort_order) FROM chapters WHERE work_id = ? AND is_deleted = 0",
    )
    .bind(work_id)
    .fetch_optional(executor)
    .await?
    .flatten();

    Ok(max_sort_order)
}

pub async fn update_title(pool: &DbPool, chapter_id: &str, title: &str) -> AppResult<()> {
    sqlx::query("UPDATE chapters SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(title)
        .bind(chapter_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_sort_order(pool: &DbPool, chapter_id: &str, sort_order: i64) -> AppResult<()> {
    sqlx::query("UPDATE chapters SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(sort_order)
        .bind(chapter_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn soft_delete<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE chapters SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(chapter_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn restore<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE chapters SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(chapter_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn delete<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM chapters WHERE id = ?")
        .bind(chapter_id)
        .execute(executor)
        .await?;
    Ok(())
}
