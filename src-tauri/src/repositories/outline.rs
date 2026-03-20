use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{ChapterOutline, SceneOutline, WorkOutline, WorkStatistics};

use tokio::try_join;

pub async fn find_work_outline(pool: &DbPool, work_id: &str) -> AppResult<WorkOutline> {
    let (chapters, scenes) = try_join!(
        sqlx::query_as::<_, ChapterOutline>(
            r#"
            SELECT
                c.id,
                c.title,
                c.sort_order,
                c.is_deleted,
                COALESCE(SUM(CASE WHEN s.is_deleted = 0 THEN s.word_count ELSE 0 END), 0) as word_count
            FROM chapters c
            LEFT JOIN scenes s ON s.chapter_id = c.id
            WHERE c.work_id = ?
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.id ASC
            "#,
        )
        .bind(work_id)
        .fetch_all(pool),
        sqlx::query_as::<_, SceneOutline>(
            r#"
            SELECT
                s.id,
                s.chapter_id,
                s.title,
                s.sort_order,
                s.is_deleted,
                s.word_count
            FROM scenes s
            INNER JOIN chapters c ON s.chapter_id = c.id
            WHERE c.work_id = ?
            ORDER BY s.sort_order ASC, s.id ASC
            "#,
        )
        .bind(work_id)
        .fetch_all(pool)
    )?;

    Ok(WorkOutline { chapters, scenes })
}

pub async fn find_work_statistics(pool: &DbPool, work_id: &str) -> AppResult<WorkStatistics> {
    let stats = sqlx::query_as::<_, WorkStatistics>(
        r#"
        SELECT
            COALESCE((
                SELECT SUM(s.word_count)
                FROM scenes s
                INNER JOIN chapters c ON s.chapter_id = c.id
                WHERE c.work_id = ?1 AND s.is_deleted = 0 AND c.is_deleted = 0
            ), 0) as total_word_count,
            COALESCE((
                SELECT COUNT(*)
                FROM scenes s
                INNER JOIN chapters c ON s.chapter_id = c.id
                WHERE c.work_id = ?1 AND s.is_deleted = 0 AND c.is_deleted = 0
            ), 0) as scene_count,
            COALESCE((
                SELECT COUNT(*)
                FROM chapters
                WHERE work_id = ?1 AND is_deleted = 0
            ), 0) as chapter_count
        "#,
    )
    .bind(work_id)
    .fetch_one(pool)
    .await?;

    Ok(stats)
}
