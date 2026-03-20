use sqlx::Executor;
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{KnowledgeType, KnowledgeTypeOutline};

pub async fn find_by_id(pool: &DbPool, type_id: &str) -> AppResult<KnowledgeType> {
    let knowledge_type = sqlx::query_as::<_, KnowledgeType>(
        "SELECT id, work_id, name, color, icon, sort_order, created_at, updated_at
         FROM knowledge_types WHERE id = ?",
    )
    .bind(type_id)
    .fetch_one(pool)
    .await?;

    Ok(knowledge_type)
}

pub async fn find_by_work(pool: &DbPool, work_id: &str) -> AppResult<Vec<KnowledgeTypeOutline>> {
    let types = sqlx::query_as::<_, KnowledgeTypeOutline>(
        "SELECT kt.id, kt.name, kt.color, kt.icon, kt.sort_order,
                (SELECT COUNT(*) FROM knowledge k WHERE k.type_id = kt.id) as count
         FROM knowledge_types kt
         WHERE kt.work_id = ?
         ORDER BY kt.sort_order ASC, kt.id ASC",
    )
    .bind(work_id)
    .fetch_all(pool)
    .await?;

    Ok(types)
}

pub async fn find_max_sort_order(pool: &DbPool, work_id: &str) -> AppResult<Option<i64>> {
    let max_sort_order: Option<i64> =
        sqlx::query_scalar("SELECT MAX(sort_order) FROM knowledge_types WHERE work_id = ?")
            .bind(work_id)
            .fetch_optional(pool)
            .await?
            .flatten();

    Ok(max_sort_order)
}

pub async fn insert<'e, E>(
    executor: E,
    work_id: &str,
    name: &str,
    color: Option<&str>,
    icon: Option<&str>,
    sort_order: i64,
) -> AppResult<String>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO knowledge_types (id, work_id, name, color, icon, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(work_id)
    .bind(name)
    .bind(color)
    .bind(icon)
    .bind(sort_order)
    .execute(executor)
    .await?;

    Ok(id)
}

pub async fn update(
    pool: &DbPool,
    type_id: &str,
    name: Option<&str>,
    color: Option<&str>,
    icon: Option<&str>,
    sort_order: Option<i64>,
) -> AppResult<()> {
    let mut query_parts = Vec::new();

    if name.is_some() {
        query_parts.push("name = ?");
    }
    if color.is_some() {
        query_parts.push("color = ?");
    }
    if icon.is_some() {
        query_parts.push("icon = ?");
    }
    if sort_order.is_some() {
        query_parts.push("sort_order = ?");
    }

    if query_parts.is_empty() {
        return Ok(());
    }

    query_parts.push("updated_at = CURRENT_TIMESTAMP");

    let query_str = format!(
        "UPDATE knowledge_types SET {} WHERE id = ?",
        query_parts.join(", ")
    );

    let mut query = sqlx::query(&query_str);

    if let Some(n) = name {
        query = query.bind(n);
    }
    if let Some(c) = color {
        query = query.bind(c);
    }
    if let Some(i) = icon {
        if i.is_empty() {
            query = query.bind(None::<&str>);
        } else {
            query = query.bind(i);
        }
    }
    if let Some(s) = sort_order {
        query = query.bind(s);
    }

    query.bind(type_id).execute(pool).await?;

    Ok(())
}

pub async fn update_sort_order(pool: &DbPool, type_id: &str, new_sort_order: i64) -> AppResult<()> {
    sqlx::query(
        "UPDATE knowledge_types SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(new_sort_order)
    .bind(type_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &DbPool, type_id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM knowledge_types WHERE id = ?")
        .bind(type_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn has_types(pool: &DbPool, work_id: &str) -> AppResult<bool> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM knowledge_types WHERE work_id = ?")
        .bind(work_id)
        .fetch_one(pool)
        .await?;

    Ok(count > 0)
}

pub async fn count_types(pool: &DbPool, work_id: &str) -> AppResult<i64> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM knowledge_types WHERE work_id = ?")
        .bind(work_id)
        .fetch_one(pool)
        .await?;

    Ok(count)
}
