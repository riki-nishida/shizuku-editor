use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::SceneVersion;

pub async fn insert(
    pool: &DbPool,
    scene_id: &str,
    content_text: &str,
    content_markups: &str,
    label: Option<&str>,
) -> AppResult<String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"
        INSERT INTO scene_versions (id, scene_id, content_text, content_markups, label)
        VALUES (?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(scene_id)
    .bind(content_text)
    .bind(content_markups)
    .bind(label)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn find_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<Vec<SceneVersion>> {
    let versions = sqlx::query_as::<_, SceneVersion>(
        r#"
        SELECT id, scene_id, content_text, content_markups, label, created_at
        FROM scene_versions
        WHERE scene_id = ?
        ORDER BY created_at DESC
        "#,
    )
    .bind(scene_id)
    .fetch_all(pool)
    .await?;

    Ok(versions)
}

pub async fn find_by_id(pool: &DbPool, version_id: &str) -> AppResult<SceneVersion> {
    let version = sqlx::query_as::<_, SceneVersion>(
        r#"
        SELECT id, scene_id, content_text, content_markups, label, created_at
        FROM scene_versions
        WHERE id = ?
        "#,
    )
    .bind(version_id)
    .fetch_one(pool)
    .await?;

    Ok(version)
}

pub async fn update_label(pool: &DbPool, version_id: &str, label: Option<&str>) -> AppResult<()> {
    sqlx::query("UPDATE scene_versions SET label = ? WHERE id = ?")
        .bind(label)
        .bind(version_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn delete(pool: &DbPool, version_id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM scene_versions WHERE id = ?")
        .bind(version_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn count_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<i64> {
    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM scene_versions WHERE scene_id = ?")
        .bind(scene_id)
        .fetch_one(pool)
        .await?;
    Ok(count)
}

pub async fn prune(pool: &DbPool, scene_id: &str, max_versions: i64) -> AppResult<u64> {
    let result = sqlx::query(
        r#"
        DELETE FROM scene_versions
        WHERE scene_id = ?
          AND id NOT IN (
            SELECT id FROM scene_versions
            WHERE scene_id = ?
            ORDER BY created_at DESC
            LIMIT ?
          )
        "#,
    )
    .bind(scene_id)
    .bind(scene_id)
    .bind(max_versions)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
