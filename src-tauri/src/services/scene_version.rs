use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::SceneVersion;
use crate::repositories::scene as scene_repo;
use crate::repositories::scene_version as repo;

const MAX_VERSIONS_PER_SCENE: i64 = 20;

fn count_words(text: &str) -> i64 {
    text.chars().filter(|c| !c.is_whitespace()).count() as i64
}

pub async fn create_version(
    pool: &DbPool,
    scene_id: &str,
    label: Option<String>,
) -> AppResult<SceneVersion> {
    let scene = scene_repo::find_by_id(pool, scene_id).await?;

    let label = label.unwrap_or_default();

    let id = repo::insert(
        pool,
        scene_id,
        &scene.content_text,
        &scene.content_markups,
        Some(&label),
    )
    .await?;

    repo::prune(pool, scene_id, MAX_VERSIONS_PER_SCENE).await?;

    repo::find_by_id(pool, &id).await
}

pub async fn get_versions(pool: &DbPool, scene_id: &str) -> AppResult<Vec<SceneVersion>> {
    repo::find_by_scene(pool, scene_id).await
}

pub async fn get_version(pool: &DbPool, version_id: &str) -> AppResult<SceneVersion> {
    repo::find_by_id(pool, version_id).await
}

pub async fn restore_version(
    pool: &DbPool,
    version_id: &str,
    pre_restore_label: Option<&str>,
) -> AppResult<bool> {
    let version = repo::find_by_id(pool, version_id).await?;
    let current_scene = scene_repo::find_by_id(pool, &version.scene_id).await?;

    if current_scene.content_text == version.content_text
        && current_scene.content_markups == version.content_markups
    {
        return Ok(false);
    }

    repo::insert(
        pool,
        &version.scene_id,
        &current_scene.content_text,
        &current_scene.content_markups,
        pre_restore_label,
    )
    .await?;

    scene_repo::update_content(
        pool,
        &version.scene_id,
        &version.content_text,
        &version.content_markups,
    )
    .await?;

    let word_count = count_words(&version.content_text);
    scene_repo::update_word_count(pool, &version.scene_id, word_count).await?;

    Ok(true)
}

pub async fn update_version_label(
    pool: &DbPool,
    version_id: &str,
    label: Option<String>,
) -> AppResult<()> {
    repo::update_label(pool, version_id, label.as_deref()).await
}

pub async fn delete_version(pool: &DbPool, version_id: &str) -> AppResult<()> {
    repo::delete(pool, version_id).await
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
        assert_eq!(count_words("こんにちは世界"), 7);
    }

    #[test]
    fn test_count_words_with_spaces() {
        assert_eq!(count_words("あ い う え お"), 5);
    }

    #[test]
    fn test_count_words_with_newlines() {
        assert_eq!(count_words("第一章\n\n彼女は静かに部屋を出た。"), 15);
    }

    #[test]
    fn test_count_words_with_tabs() {
        assert_eq!(count_words("　冒頭\t中間\n末尾"), 6);
    }

    #[test]
    fn test_count_words_mixed_content() {
        assert_eq!(count_words("Hello世界！\nこんにちは World"), 18);
    }

    #[test]
    fn test_count_words_only_whitespace() {
        assert_eq!(count_words("   \n\t  \n  "), 0);
    }

    #[test]
    fn test_count_words_punctuation() {
        assert_eq!(count_words("「こんにちは」と彼女は言った。"), 15);
    }
}
