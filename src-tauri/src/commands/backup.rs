use tauri::{AppHandle, State};

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::BackupInfo;
use crate::services::backup;

#[tauri::command]
pub async fn create_backup(
    app_handle: AppHandle,
    pool: State<'_, DbPool>,
    is_auto: bool,
) -> Result<BackupInfo, AppError> {
    backup::create_backup(&app_handle, &pool, is_auto).await
}

#[tauri::command]
pub async fn list_backups(app_handle: AppHandle) -> Result<Vec<BackupInfo>, AppError> {
    backup::list_backups(&app_handle)
}

#[tauri::command]
pub async fn restore_backup(
    app_handle: AppHandle,
    backup_filename: String,
) -> Result<(), AppError> {
    backup::restore_backup(&app_handle, &backup_filename)
}

#[tauri::command]
pub async fn delete_backup(app_handle: AppHandle, backup_filename: String) -> Result<(), AppError> {
    backup::delete_backup(&app_handle, &backup_filename)
}

#[tauri::command]
pub async fn get_backup_dir_path(app_handle: AppHandle) -> Result<String, AppError> {
    backup::get_backup_dir_path(&app_handle)
}

#[tauri::command]
pub async fn restart_app(app_handle: AppHandle) -> Result<(), AppError> {
    app_handle.restart();
}
