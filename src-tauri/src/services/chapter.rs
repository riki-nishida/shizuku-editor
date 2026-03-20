use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::ChapterOutline;
use crate::repositories::{chapter as repo, scene as scene_repo};

pub async fn create_chapter(
    pool: &DbPool,
    work_id: &str,
    title: &str,
) -> AppResult<ChapterOutline> {
    let max_sort_order = repo::find_max_sort_order(pool, work_id).await?;
    let new_sort_order = max_sort_order.unwrap_or(0) + 1;

    let id = repo::insert(pool, work_id, title, new_sort_order).await?;

    Ok(ChapterOutline {
        id,
        title: title.to_string(),
        sort_order: new_sort_order,
        is_deleted: false,
        word_count: 0,
    })
}

pub async fn update_chapter_title(pool: &DbPool, chapter_id: &str, title: &str) -> AppResult<()> {
    repo::update_title(pool, chapter_id, title).await
}

pub async fn update_chapter_sort_order(
    pool: &DbPool,
    chapter_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::update_sort_order(pool, chapter_id, new_sort_order).await
}

pub async fn delete_chapter(pool: &DbPool, chapter_id: &str) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    repo::soft_delete(&mut *tx, chapter_id).await?;

    scene_repo::soft_delete_by_chapter(&mut *tx, chapter_id).await?;

    tx.commit().await?;
    Ok(())
}

pub async fn restore_chapter(pool: &DbPool, chapter_id: &str) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    repo::restore(&mut *tx, chapter_id).await?;

    scene_repo::restore_by_chapter(&mut *tx, chapter_id).await?;

    tx.commit().await?;
    Ok(())
}

pub async fn permanent_delete_chapter(pool: &DbPool, chapter_id: &str) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    scene_repo::delete_by_chapter(&mut *tx, chapter_id).await?;

    repo::delete(&mut *tx, chapter_id).await?;

    tx.commit().await?;
    Ok(())
}
