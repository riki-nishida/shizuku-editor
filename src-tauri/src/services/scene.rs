use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{Scene, SceneOutline, SceneSearchResult};
use crate::repositories::scene as repo;

pub async fn get_scene(pool: &DbPool, scene_id: &str) -> AppResult<Scene> {
    repo::find_by_id(pool, scene_id).await
}

pub async fn get_scenes_by_chapter(pool: &DbPool, chapter_id: &str) -> AppResult<Vec<Scene>> {
    repo::find_by_chapter(pool, chapter_id).await
}

pub async fn create_scene(pool: &DbPool, chapter_id: &str, title: &str) -> AppResult<SceneOutline> {
    let max_sort_order = repo::find_max_sort_order(pool, chapter_id).await?;
    let new_sort_order = max_sort_order.unwrap_or(0) + 1;

    let id = repo::insert(pool, chapter_id, title, new_sort_order).await?;

    Ok(SceneOutline {
        id,
        chapter_id: chapter_id.to_string(),
        title: title.to_string(),
        sort_order: new_sort_order,
        is_deleted: false,
        word_count: 0,
    })
}

pub async fn update_scene_title(pool: &DbPool, scene_id: &str, title: &str) -> AppResult<()> {
    repo::update_title(pool, scene_id, title).await
}

pub async fn update_scene_content(
    pool: &DbPool,
    scene_id: &str,
    content_text: &str,
    content_markups: &str,
) -> AppResult<()> {
    let word_count = count_words(content_text);

    let mut tx = pool.begin().await?;

    repo::update_content(&mut *tx, scene_id, content_text, content_markups).await?;

    repo::update_word_count_field(&mut *tx, scene_id, word_count).await?;

    tx.commit().await?;

    Ok(())
}

pub async fn update_scene_synopsis(pool: &DbPool, scene_id: &str, synopsis: &str) -> AppResult<()> {
    repo::update_synopsis(pool, scene_id, synopsis).await
}

pub async fn update_scene_word_count(
    pool: &DbPool,
    scene_id: &str,
    word_count: i64,
) -> AppResult<()> {
    repo::update_word_count(pool, scene_id, word_count).await
}

pub async fn update_scene_sort_order(
    pool: &DbPool,
    scene_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::update_sort_order(pool, scene_id, new_sort_order).await
}

pub async fn move_scene_to_chapter(
    pool: &DbPool,
    scene_id: &str,
    new_chapter_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::move_to_chapter(pool, scene_id, new_chapter_id, new_sort_order).await
}

pub async fn delete_scene(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    repo::soft_delete(pool, scene_id).await
}

pub async fn restore_scene(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    repo::restore(pool, scene_id).await
}

pub async fn permanent_delete_scene(pool: &DbPool, scene_id: &str) -> AppResult<()> {
    repo::delete(pool, scene_id).await
}

pub async fn search_scenes(
    pool: &DbPool,
    work_id: &str,
    query: &str,
) -> AppResult<Vec<SceneSearchResult>> {
    repo::search(pool, work_id, query).await
}

fn count_words(text: &str) -> i64 {
    text.chars().filter(|c| !c.is_whitespace()).count() as i64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_words_empty() {
        assert_eq!(count_words(""), 0);
    }

    #[test]
    fn test_count_words_japanese() {
        assert_eq!(count_words("こんにちは"), 5);
    }

    #[test]
    fn test_count_words_with_spaces() {
        assert_eq!(count_words("あ い う え お"), 5);
    }

    #[test]
    fn test_count_words_with_newlines() {
        assert_eq!(count_words("あいう\nえお"), 5);
    }

    #[test]
    fn test_count_words_mixed() {
        assert_eq!(count_words("Hello世界"), 7);
    }
}
