use sqlx::Executor;
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::Work;

pub async fn find_all(pool: &DbPool) -> AppResult<Vec<Work>> {
    let works = sqlx::query_as::<_, Work>(
        "SELECT id, name, created_at, updated_at
         FROM works
         ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;

    Ok(works)
}

pub async fn find_by_id(pool: &DbPool, work_id: &str) -> AppResult<Work> {
    let work = sqlx::query_as::<_, Work>(
        "SELECT id, name, created_at, updated_at
         FROM works
         WHERE id = ?",
    )
    .bind(work_id)
    .fetch_one(pool)
    .await?;

    Ok(work)
}

pub async fn insert(pool: &DbPool, name: &str) -> AppResult<String> {
    insert_with_executor(pool, name).await
}

pub async fn insert_with_executor<'e, E>(executor: E, name: &str) -> AppResult<String>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO works (id, name) VALUES (?, ?)")
        .bind(&id)
        .bind(name)
        .execute(executor)
        .await?;

    Ok(id)
}

pub async fn delete(pool: &DbPool, work_id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM works WHERE id = ?")
        .bind(work_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn update_name(pool: &DbPool, work_id: &str, name: &str) -> AppResult<()> {
    sqlx::query("UPDATE works SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(name)
        .bind(work_id)
        .execute(pool)
        .await?;

    Ok(())
}
