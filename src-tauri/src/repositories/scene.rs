use sqlx::Executor;
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{Scene, SceneSearchResult};

pub async fn find_by_id(pool: &DbPool, scene_id: &str) -> AppResult<Scene> {
    let scene = sqlx::query_as::<_, Scene>(
        r#"
        SELECT
            id, chapter_id, title, synopsis,
            content_text, content_markups,
            word_count, sort_order, is_deleted,
            created_at, updated_at
        FROM scenes
        WHERE id = ?
        "#,
    )
    .bind(scene_id)
    .fetch_one(pool)
    .await?;

    Ok(scene)
}

pub async fn find_work_id<'e, E>(executor: E, scene_id: &str) -> AppResult<String>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    let work_id: String = sqlx::query_scalar(
        r#"
        SELECT c.work_id
        FROM scenes s
        INNER JOIN chapters c ON s.chapter_id = c.id
        WHERE s.id = ?
        "#,
    )
    .bind(scene_id)
    .fetch_one(executor)
    .await?;

    Ok(work_id)
}

pub async fn find_by_chapter(pool: &DbPool, chapter_id: &str) -> AppResult<Vec<Scene>> {
    let scenes = sqlx::query_as::<_, Scene>(
        r#"
        SELECT
            id, chapter_id, title, synopsis,
            content_text, content_markups,
            word_count, sort_order, is_deleted,
            created_at, updated_at
        FROM scenes
        WHERE chapter_id = ? AND is_deleted = false
        ORDER BY sort_order ASC, id ASC
        "#,
    )
    .bind(chapter_id)
    .fetch_all(pool)
    .await?;

    Ok(scenes)
}

pub async fn find_max_sort_order(pool: &DbPool, chapter_id: &str) -> AppResult<Option<i64>> {
    let max_sort_order: Option<i64> = sqlx::query_scalar(
        "SELECT MAX(sort_order) FROM scenes WHERE chapter_id = ? AND is_deleted = 0",
    )
    .bind(chapter_id)
    .fetch_optional(pool)
    .await?
    .flatten();

    Ok(max_sort_order)
}

pub async fn insert(
    pool: &DbPool,
    chapter_id: &str,
    title: &str,
    sort_order: i64,
) -> AppResult<String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO scenes (id, chapter_id, title, content_text, content_markups, sort_order, word_count, is_deleted) VALUES (?, ?, ?, '', '[]', ?, 0, 0)",
    )
    .bind(&id)
    .bind(chapter_id)
    .bind(title)
    .bind(sort_order)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn update_title(pool: &DbPool, scene_id: &str, title: &str) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(title)
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_content<'e, E>(
    executor: E,
    scene_id: &str,
    content_text: &str,
    content_markups: &str,
) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE scenes SET content_text = ?, content_markups = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(content_text)
    .bind(content_markups)
    .bind(scene_id)
    .execute(executor)
    .await?;
    Ok(())
}

pub async fn update_word_count_field<'e, E>(
    executor: E,
    scene_id: &str,
    word_count: i64,
) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE scenes SET word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(word_count)
        .bind(scene_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn update_synopsis(pool: &DbPool, scene_id: &str, synopsis: &str) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET synopsis = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(synopsis)
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_word_count(pool: &DbPool, scene_id: &str, word_count: i64) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(word_count)
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_sort_order(
    pool: &DbPool,
    scene_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(new_sort_order)
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn move_to_chapter(
    pool: &DbPool,
    scene_id: &str,
    new_chapter_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET chapter_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(new_chapter_id)
        .bind(new_sort_order)
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn soft_delete(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn restore(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    sqlx::query("UPDATE scenes SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(scene_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete<'e, E>(executor: E, scene_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM scenes WHERE id = ?")
        .bind(scene_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn soft_delete_by_chapter<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE scenes SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE chapter_id = ?",
    )
    .bind(chapter_id)
    .execute(executor)
    .await?;
    Ok(())
}

pub async fn restore_by_chapter<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE scenes SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE chapter_id = ?",
    )
    .bind(chapter_id)
    .execute(executor)
    .await?;
    Ok(())
}

pub async fn delete_by_chapter<'e, E>(executor: E, chapter_id: &str) -> AppResult<()>
where
    E: Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM scenes WHERE chapter_id = ?")
        .bind(chapter_id)
        .execute(executor)
        .await?;
    Ok(())
}

pub async fn find_all_by_work(pool: &DbPool, work_id: &str) -> AppResult<Vec<Scene>> {
    let scenes = sqlx::query_as::<_, Scene>(
        r#"
        SELECT
            s.id, s.chapter_id, s.title, s.synopsis,
            s.content_text, s.content_markups,
            s.word_count, s.sort_order, s.is_deleted,
            s.created_at, s.updated_at
        FROM scenes s
        INNER JOIN chapters c ON s.chapter_id = c.id
        WHERE c.work_id = ? AND s.is_deleted = 0 AND c.is_deleted = 0
        ORDER BY c.sort_order ASC, s.sort_order ASC
        "#,
    )
    .bind(work_id)
    .fetch_all(pool)
    .await?;

    Ok(scenes)
}

pub async fn search(
    pool: &DbPool,
    work_id: &str,
    query: &str,
) -> AppResult<Vec<SceneSearchResult>> {
    let search_pattern = format!("%{}%", query);

    let results = sqlx::query_as::<_, SceneSearchResult>(
        r#"
        SELECT
            s.id,
            s.chapter_id,
            s.title,
            SUBSTR(s.content_text, MAX(1, INSTR(LOWER(s.content_text), LOWER(?)) - 20), 80) as matched_text
        FROM scenes s
        INNER JOIN chapters c ON s.chapter_id = c.id
        WHERE c.work_id = ?
          AND s.is_deleted = 0
          AND c.is_deleted = 0
          AND (LOWER(s.content_text) LIKE LOWER(?) OR LOWER(s.title) LIKE LOWER(?))
        ORDER BY c.sort_order ASC, s.sort_order ASC
        "#,
    )
    .bind(query)
    .bind(work_id)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await?;

    Ok(results)
}
