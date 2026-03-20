use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::SceneImage;

pub async fn find_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<Vec<SceneImage>> {
    let images = sqlx::query_as::<_, SceneImage>(
        r#"
        SELECT id, scene_id, file_path, file_name, file_size, mime_type, sort_order, created_at
        FROM scene_images
        WHERE scene_id = ?
        ORDER BY sort_order ASC
        "#,
    )
    .bind(scene_id)
    .fetch_all(pool)
    .await?;

    Ok(images)
}

pub async fn find_by_id(pool: &DbPool, id: &str) -> AppResult<Option<SceneImage>> {
    let image = sqlx::query_as::<_, SceneImage>(
        r#"
        SELECT id, scene_id, file_path, file_name, file_size, mime_type, sort_order, created_at
        FROM scene_images
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(image)
}

pub async fn insert(
    pool: &DbPool,
    scene_id: &str,
    file_path: &str,
    file_name: &str,
    file_size: i64,
    mime_type: &str,
) -> AppResult<SceneImage> {
    let id = Uuid::new_v4().to_string();

    let max_sort: Option<i64> =
        sqlx::query_scalar("SELECT MAX(sort_order) FROM scene_images WHERE scene_id = ?")
            .bind(scene_id)
            .fetch_one(pool)
            .await?;

    let sort_order = max_sort.unwrap_or(0) + 1;

    sqlx::query(
        r#"
        INSERT INTO scene_images (id, scene_id, file_path, file_name, file_size, mime_type, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(scene_id)
    .bind(file_path)
    .bind(file_name)
    .bind(file_size)
    .bind(mime_type)
    .bind(sort_order)
    .execute(pool)
    .await?;

    find_by_id(pool, &id)
        .await?
        .ok_or_else(|| crate::error::AppError::Internal("Failed to retrieve created image".into()))
}

pub async fn update_sort_order(pool: &DbPool, id: &str, new_sort_order: i64) -> AppResult<()> {
    sqlx::query(
        "UPDATE scene_images SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(new_sort_order)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &DbPool, id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM scene_images WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM scene_images WHERE scene_id = ?")
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}
