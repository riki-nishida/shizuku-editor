use tauri::{AppHandle, State};

use crate::error::AppError;
use crate::services::knowledge_type;
use crate::{db::DbPool, models::Work, services::work};

#[tauri::command]
pub async fn list_works(pool: State<'_, DbPool>) -> Result<Vec<Work>, AppError> {
    work::list_works(pool.inner()).await
}

#[tauri::command]
pub async fn create_work(
    app_handle: AppHandle,
    pool: State<'_, DbPool>,
    name: String,
) -> Result<String, AppError> {
    let language = knowledge_type::get_language_from_store(&app_handle);
    work::create_work(pool.inner(), &name, &language).await
}

#[tauri::command]
pub async fn delete_work(pool: State<'_, DbPool>, work_id: String) -> Result<(), AppError> {
    work::delete_work(pool.inner(), &work_id).await
}

#[tauri::command]
pub async fn update_work_name(
    pool: State<'_, DbPool>,
    work_id: String,
    name: String,
) -> Result<(), AppError> {
    work::update_work_name(pool.inner(), &work_id, &name).await
}

#[tauri::command]
pub async fn get_chapter_count(pool: State<'_, DbPool>, work_id: String) -> Result<i64, AppError> {
    work::get_chapter_count(pool.inner(), &work_id).await
}

#[tauri::command]
pub async fn get_work(pool: State<'_, DbPool>, work_id: String) -> Result<Work, AppError> {
    work::get_work(pool.inner(), &work_id).await
}
