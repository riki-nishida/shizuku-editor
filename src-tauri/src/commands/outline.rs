use tauri::State;

use crate::error::AppError;
use crate::{
    db::DbPool,
    models::{ChapterOutline, Scene, SceneOutline, SceneSearchResult, WorkOutline, WorkStatistics},
    services::{chapter, outline, scene},
};

#[tauri::command]
pub async fn get_work_outline(
    pool: State<'_, DbPool>,
    work_id: String,
) -> Result<WorkOutline, AppError> {
    outline::get_work_outline(pool.inner(), &work_id).await
}

#[tauri::command]
pub async fn update_chapter_sort_order(
    pool: State<'_, DbPool>,
    chapter_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    chapter::update_chapter_sort_order(pool.inner(), &chapter_id, new_sort_order).await
}

#[tauri::command]
pub async fn update_scene_sort_order(
    pool: State<'_, DbPool>,
    scene_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    scene::update_scene_sort_order(pool.inner(), &scene_id, new_sort_order).await
}

#[tauri::command]
pub async fn move_scene_to_chapter(
    pool: State<'_, DbPool>,
    scene_id: String,
    new_chapter_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    scene::move_scene_to_chapter(pool.inner(), &scene_id, &new_chapter_id, new_sort_order).await
}

#[tauri::command]
pub async fn delete_chapter(pool: State<'_, DbPool>, chapter_id: String) -> Result<(), AppError> {
    chapter::delete_chapter(pool.inner(), &chapter_id).await
}

#[tauri::command]
pub async fn delete_scene(pool: State<'_, DbPool>, scene_id: String) -> Result<(), AppError> {
    scene::delete_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn restore_chapter(pool: State<'_, DbPool>, chapter_id: String) -> Result<(), AppError> {
    chapter::restore_chapter(pool.inner(), &chapter_id).await
}

#[tauri::command]
pub async fn restore_scene(pool: State<'_, DbPool>, scene_id: String) -> Result<(), AppError> {
    scene::restore_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn permanent_delete_chapter(
    pool: State<'_, DbPool>,
    chapter_id: String,
) -> Result<(), AppError> {
    chapter::permanent_delete_chapter(pool.inner(), &chapter_id).await
}

#[tauri::command]
pub async fn permanent_delete_scene(
    pool: State<'_, DbPool>,
    scene_id: String,
) -> Result<(), AppError> {
    scene::permanent_delete_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn update_chapter_title(
    pool: State<'_, DbPool>,
    chapter_id: String,
    title: String,
) -> Result<(), AppError> {
    chapter::update_chapter_title(pool.inner(), &chapter_id, &title).await
}

#[tauri::command]
pub async fn update_scene_title(
    pool: State<'_, DbPool>,
    scene_id: String,
    title: String,
) -> Result<(), AppError> {
    scene::update_scene_title(pool.inner(), &scene_id, &title).await
}

#[tauri::command]
pub async fn create_chapter(
    pool: State<'_, DbPool>,
    work_id: String,
    title: String,
) -> Result<ChapterOutline, AppError> {
    chapter::create_chapter(pool.inner(), &work_id, &title).await
}

#[tauri::command]
pub async fn create_scene(
    pool: State<'_, DbPool>,
    chapter_id: String,
    title: String,
) -> Result<SceneOutline, AppError> {
    scene::create_scene(pool.inner(), &chapter_id, &title).await
}

#[tauri::command]
pub async fn get_scene(pool: State<'_, DbPool>, scene_id: String) -> Result<Scene, AppError> {
    scene::get_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn get_scenes_by_chapter(
    pool: State<'_, DbPool>,
    chapter_id: String,
) -> Result<Vec<Scene>, AppError> {
    scene::get_scenes_by_chapter(pool.inner(), &chapter_id).await
}

#[tauri::command]
pub async fn update_scene_content(
    pool: State<'_, DbPool>,
    scene_id: String,
    content_text: String,
    content_markups: String,
) -> Result<(), AppError> {
    scene::update_scene_content(pool.inner(), &scene_id, &content_text, &content_markups).await
}

#[tauri::command]
pub async fn update_scene_synopsis(
    pool: State<'_, DbPool>,
    scene_id: String,
    synopsis: String,
) -> Result<(), AppError> {
    scene::update_scene_synopsis(pool.inner(), &scene_id, &synopsis).await
}

#[tauri::command]
pub async fn update_scene_word_count(
    pool: State<'_, DbPool>,
    scene_id: String,
    word_count: i64,
) -> Result<(), AppError> {
    scene::update_scene_word_count(pool.inner(), &scene_id, word_count).await
}

#[tauri::command]
pub async fn search_scenes(
    pool: State<'_, DbPool>,
    work_id: String,
    query: String,
) -> Result<Vec<SceneSearchResult>, AppError> {
    scene::search_scenes(pool.inner(), &work_id, &query).await
}

#[tauri::command]
pub async fn get_work_statistics(
    pool: State<'_, DbPool>,
    work_id: String,
) -> Result<WorkStatistics, AppError> {
    outline::get_work_statistics(pool.inner(), &work_id).await
}
