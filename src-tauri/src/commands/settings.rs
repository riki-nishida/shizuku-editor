use tauri::AppHandle;

use crate::error::AppError;
use crate::models::Settings;
use crate::services::settings;

#[tauri::command]
pub fn get_settings(app_handle: AppHandle) -> Result<Settings, AppError> {
    settings::load_settings(&app_handle)
}

#[tauri::command]
pub fn save_settings(app_handle: AppHandle, settings: Settings) -> Result<Settings, AppError> {
    settings::save_settings(&app_handle, &settings)?;
    Ok(settings)
}
