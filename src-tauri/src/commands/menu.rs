use tauri::AppHandle;

#[tauri::command]
pub fn set_scene_menus_enabled(app_handle: AppHandle, enabled: bool) {
    crate::menu::set_scene_menus_enabled(app_handle, enabled);
}

#[tauri::command]
pub fn set_split_view_menu_enabled(app_handle: AppHandle, enabled: bool) {
    crate::menu::set_split_view_menu_enabled(app_handle, enabled);
}
