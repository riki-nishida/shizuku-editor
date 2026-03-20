use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::SceneVersion;
use crate::services::scene_version;

#[tauri::command]
pub async fn create_scene_version(
    pool: State<'_, DbPool>,
    scene_id: String,
    label: Option<String>,
) -> Result<SceneVersion, AppError> {
    scene_version::create_version(pool.inner(), &scene_id, label).await
}

#[tauri::command]
pub async fn get_scene_versions(
    pool: State<'_, DbPool>,
    scene_id: String,
) -> Result<Vec<SceneVersion>, AppError> {
    scene_version::get_versions(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn get_scene_version(
    pool: State<'_, DbPool>,
    version_id: String,
) -> Result<SceneVersion, AppError> {
    scene_version::get_version(pool.inner(), &version_id).await
}

#[tauri::command]
pub async fn restore_scene_version(
    pool: State<'_, DbPool>,
    version_id: String,
    pre_restore_label: Option<String>,
) -> Result<bool, AppError> {
    scene_version::restore_version(pool.inner(), &version_id, pre_restore_label.as_deref()).await
}

#[tauri::command]
pub async fn update_scene_version_label(
    pool: State<'_, DbPool>,
    version_id: String,
    label: Option<String>,
) -> Result<(), AppError> {
    scene_version::update_version_label(pool.inner(), &version_id, label).await
}

#[tauri::command]
pub async fn delete_scene_version(
    pool: State<'_, DbPool>,
    version_id: String,
) -> Result<(), AppError> {
    scene_version::delete_version(pool.inner(), &version_id).await
}
