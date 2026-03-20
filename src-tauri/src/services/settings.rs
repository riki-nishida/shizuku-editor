use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

use crate::error::{AppError, AppResult};
use crate::models::Settings;

const SETTINGS_STORE_PATH: &str = "settings.json";
const SETTINGS_KEY: &str = "settings";

pub fn load_settings(app_handle: &AppHandle<Wry>) -> AppResult<Settings> {
    let store = app_handle
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open settings store: {}", e)))?;

    let stored_value = store.get(SETTINGS_KEY);
    let mut needs_write = false;
    let settings = if let Some(value) = stored_value {
        match serde_json::from_value::<Settings>(value) {
            Ok(parsed) => parsed,
            Err(_) => {
                needs_write = true;
                Settings::default()
            }
        }
    } else {
        needs_write = true;
        Settings::default()
    };

    if needs_write {
        let value = serde_json::to_value(&settings)?;
        store.set(SETTINGS_KEY, value);
        store
            .save()
            .map_err(|e| AppError::Internal(format!("failed to save default settings: {}", e)))?;
    }

    store.close_resource();
    Ok(settings)
}

pub fn save_settings(app_handle: &AppHandle<Wry>, settings: &Settings) -> AppResult<()> {
    let store = app_handle
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open settings store: {}", e)))?;
    let value = serde_json::to_value(settings)?;
    store.set(SETTINGS_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist settings: {}", e)))?;
    store.close_resource();
    Ok(())
}
