use crate::services::font;

#[tauri::command]
pub fn list_system_fonts() -> Vec<String> {
    font::list_system_fonts().clone()
}
