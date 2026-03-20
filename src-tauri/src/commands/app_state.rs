use std::collections::HashMap;

use tauri::AppHandle;

use crate::error::AppError;
use crate::models::app_state::{SelectedNode, SidebarSections, SplitViewPanes};
use crate::services::app_state;

#[tauri::command]
pub fn get_selected_work_id(app_handle: AppHandle) -> Result<Option<String>, AppError> {
    app_state::load_selected_work_id(&app_handle)
}

#[tauri::command]
pub fn save_selected_work_id(app_handle: AppHandle, work_id: String) -> Result<(), AppError> {
    app_state::save_selected_work_id(&app_handle, work_id)
}

#[tauri::command]
pub fn clear_selected_work_id(app_handle: AppHandle) -> Result<(), AppError> {
    app_state::clear_selected_work_id(&app_handle)
}

#[tauri::command]
pub fn get_selected_node(
    app_handle: AppHandle,
    work_id: String,
) -> Result<Option<SelectedNode>, AppError> {
    app_state::load_selected_node(&app_handle, work_id)
}

#[tauri::command]
pub fn save_selected_node(
    app_handle: AppHandle,
    work_id: String,
    node: Option<SelectedNode>,
) -> Result<(), AppError> {
    app_state::save_selected_node(&app_handle, work_id, node)
}

#[tauri::command]
pub fn get_expanded_chapters(
    app_handle: AppHandle,
    work_id: String,
) -> Result<HashMap<String, bool>, AppError> {
    app_state::load_expanded_chapters(&app_handle, work_id)
}

#[tauri::command]
pub fn save_expanded_chapters(
    app_handle: AppHandle,
    work_id: String,
    expanded: HashMap<String, bool>,
) -> Result<(), AppError> {
    app_state::save_expanded_chapters(&app_handle, work_id, expanded)
}

#[tauri::command]
pub fn delete_work_ui_state(app_handle: AppHandle, work_id: String) -> Result<(), AppError> {
    app_state::delete_work_ui_state(&app_handle, work_id)
}

#[tauri::command]
pub fn get_panel_sizes(app_handle: AppHandle) -> Result<Vec<f64>, AppError> {
    app_state::load_panel_sizes(&app_handle)
}

#[tauri::command]
pub fn save_panel_sizes(app_handle: AppHandle, sizes: Vec<f64>) -> Result<(), AppError> {
    app_state::save_panel_sizes(&app_handle, sizes)
}

#[tauri::command]
pub fn get_inspector_collapsed(app_handle: AppHandle) -> Result<bool, AppError> {
    app_state::load_inspector_collapsed(&app_handle)
}

#[tauri::command]
pub fn save_inspector_collapsed(app_handle: AppHandle, collapsed: bool) -> Result<(), AppError> {
    app_state::save_inspector_collapsed(&app_handle, collapsed)
}

#[tauri::command]
pub fn get_inspector_sections(app_handle: AppHandle) -> Result<HashMap<String, bool>, AppError> {
    app_state::load_inspector_sections(&app_handle)
}

#[tauri::command]
pub fn save_inspector_sections(
    app_handle: AppHandle,
    sections: HashMap<String, bool>,
) -> Result<(), AppError> {
    app_state::save_inspector_sections(&app_handle, sections)
}

#[tauri::command]
pub fn get_inspector_section_order(app_handle: AppHandle) -> Result<Vec<String>, AppError> {
    app_state::load_inspector_section_order(&app_handle)
}

#[tauri::command]
pub fn save_inspector_section_order(
    app_handle: AppHandle,
    order: Vec<String>,
) -> Result<(), AppError> {
    app_state::save_inspector_section_order(&app_handle, order)
}

#[tauri::command]
pub fn get_split_view_direction(app_handle: AppHandle) -> Result<String, AppError> {
    app_state::load_split_view_direction(&app_handle)
}

#[tauri::command]
pub fn save_split_view_direction(app_handle: AppHandle, direction: String) -> Result<(), AppError> {
    app_state::save_split_view_direction(&app_handle, direction)
}

#[tauri::command]
pub fn get_split_view_ratio(app_handle: AppHandle) -> Result<f64, AppError> {
    app_state::load_split_view_ratio(&app_handle)
}

#[tauri::command]
pub fn save_split_view_ratio(app_handle: AppHandle, ratio: f64) -> Result<(), AppError> {
    app_state::save_split_view_ratio(&app_handle, ratio)
}

#[tauri::command]
pub fn get_split_view_panes(app_handle: AppHandle) -> Result<SplitViewPanes, AppError> {
    app_state::load_split_view_panes(&app_handle)
}

#[tauri::command]
pub fn save_split_view_panes(app_handle: AppHandle, panes: SplitViewPanes) -> Result<(), AppError> {
    app_state::save_split_view_panes(&app_handle, panes)
}

#[tauri::command]
pub fn get_sidebar_sections(app_handle: AppHandle) -> Result<SidebarSections, AppError> {
    app_state::load_sidebar_sections(&app_handle)
}

#[tauri::command]
pub fn save_sidebar_sections(
    app_handle: AppHandle,
    sections: SidebarSections,
) -> Result<(), AppError> {
    app_state::save_sidebar_sections(&app_handle, sections)
}

#[tauri::command]
pub fn get_sidebar_section_ratio(app_handle: AppHandle) -> Result<f64, AppError> {
    app_state::load_sidebar_section_ratio(&app_handle)
}

#[tauri::command]
pub fn save_sidebar_section_ratio(app_handle: AppHandle, ratio: f64) -> Result<(), AppError> {
    app_state::save_sidebar_section_ratio(&app_handle, ratio)
}

#[tauri::command]
pub fn get_inspector_tab(app_handle: AppHandle) -> Result<String, AppError> {
    app_state::load_inspector_tab(&app_handle)
}

#[tauri::command]
pub fn save_inspector_tab(app_handle: AppHandle, tab: String) -> Result<(), AppError> {
    app_state::save_inspector_tab(&app_handle, tab)
}
