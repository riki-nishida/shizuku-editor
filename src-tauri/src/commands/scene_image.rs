use tauri::{AppHandle, State};

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::SceneImage;
use crate::services::scene_image;

#[tauri::command]
pub async fn get_scene_images(
    pool: State<'_, DbPool>,
    scene_id: String,
) -> Result<Vec<SceneImage>, AppError> {
    scene_image::get_by_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn add_scene_image(
    pool: State<'_, DbPool>,
    app_handle: AppHandle,
    scene_id: String,
    source_path: String,
) -> Result<SceneImage, AppError> {
    scene_image::add_image(pool.inner(), &app_handle, &scene_id, &source_path).await
}

#[tauri::command]
pub async fn delete_scene_image(
    pool: State<'_, DbPool>,
    app_handle: AppHandle,
    image_id: String,
) -> Result<(), AppError> {
    scene_image::delete_image(pool.inner(), &app_handle, &image_id).await
}

#[tauri::command]
pub async fn update_scene_image_sort_order(
    pool: State<'_, DbPool>,
    image_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    scene_image::update_sort_order(pool.inner(), &image_id, new_sort_order).await
}

#[tauri::command]
pub fn get_scene_image_path(
    app_handle: AppHandle,
    relative_path: String,
) -> Result<String, AppError> {
    let path = scene_image::get_image_path(&app_handle, &relative_path)?;
    Ok(path.to_string_lossy().into_owned())
}
