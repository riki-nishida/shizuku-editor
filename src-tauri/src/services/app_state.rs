use std::collections::HashMap;

use tauri::{AppHandle, Wry};
use tauri_plugin_store::StoreExt;

use crate::error::{AppError, AppResult};
use crate::models::app_state::{SelectedNode, SidebarSections, SplitViewPanes, WorkUiState};

const APP_STATE_STORE_PATH: &str = "app-state.json";
const SELECTED_WORK_ID_KEY: &str = "selected_work_id";
const WORK_UI_STATES_KEY: &str = "work_ui_states";
const PANEL_SIZES_KEY: &str = "panel_sizes";
const INSPECTOR_COLLAPSED_KEY: &str = "inspector_collapsed";
const INSPECTOR_SECTIONS_KEY: &str = "inspector_sections";
const INSPECTOR_SECTION_ORDER_KEY: &str = "inspector_section_order";
const SPLIT_VIEW_DIRECTION_KEY: &str = "split_view_direction";
const SPLIT_VIEW_RATIO_KEY: &str = "split_view_ratio";
const SPLIT_VIEW_PANES_KEY: &str = "split_view_panes";
const SIDEBAR_SECTIONS_KEY: &str = "sidebar_sections";
const SIDEBAR_SECTION_RATIO_KEY: &str = "sidebar_section_ratio";
const INSPECTOR_TAB_KEY: &str = "inspector_tab";

const DEFAULT_PANEL_SIZES: [f64; 3] = [20.0, 60.0, 20.0];
const DEFAULT_SIDEBAR_SECTION_RATIO: f64 = 0.6;

pub fn load_selected_work_id(app_handle: &AppHandle<Wry>) -> AppResult<Option<String>> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SELECTED_WORK_ID_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<Option<String>>(value).unwrap_or(None)
    } else {
        None
    };

    store.close_resource();
    Ok(result)
}

pub fn save_selected_work_id(app_handle: &AppHandle<Wry>, work_id: String) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(Some(work_id))?;
    store.set(SELECTED_WORK_ID_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist selected work id: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn clear_selected_work_id(app_handle: &AppHandle<Wry>) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(None::<String>)?;
    store.set(SELECTED_WORK_ID_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist selected work id: {}", e)))?;
    store.close_resource();
    Ok(())
}

fn load_all_work_ui_states(app_handle: &AppHandle<Wry>) -> AppResult<HashMap<String, WorkUiState>> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(WORK_UI_STATES_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<HashMap<String, WorkUiState>>(value).unwrap_or_default()
    } else {
        HashMap::new()
    };

    store.close_resource();
    Ok(result)
}

fn save_all_work_ui_states(
    app_handle: &AppHandle<Wry>,
    states: HashMap<String, WorkUiState>,
) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(states)?;
    store.set(WORK_UI_STATES_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist work ui states: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_work_ui_state(app_handle: &AppHandle<Wry>, work_id: String) -> AppResult<WorkUiState> {
    let states = load_all_work_ui_states(app_handle)?;
    Ok(states.get(&work_id).cloned().unwrap_or_default())
}

pub fn save_work_ui_state(
    app_handle: &AppHandle<Wry>,
    work_id: String,
    state: WorkUiState,
) -> AppResult<()> {
    let mut states = load_all_work_ui_states(app_handle)?;
    states.insert(work_id, state);
    save_all_work_ui_states(app_handle, states)
}

pub fn delete_work_ui_state(app_handle: &AppHandle<Wry>, work_id: String) -> AppResult<()> {
    let mut states = load_all_work_ui_states(app_handle)?;
    states.remove(&work_id);
    save_all_work_ui_states(app_handle, states)
}

pub fn load_selected_node(
    app_handle: &AppHandle<Wry>,
    work_id: String,
) -> AppResult<Option<SelectedNode>> {
    let state = load_work_ui_state(app_handle, work_id)?;
    Ok(state.selected_node)
}

pub fn save_selected_node(
    app_handle: &AppHandle<Wry>,
    work_id: String,
    node: Option<SelectedNode>,
) -> AppResult<()> {
    let mut state = load_work_ui_state(app_handle, work_id.clone())?;
    state.selected_node = node;
    save_work_ui_state(app_handle, work_id, state)
}

pub fn load_expanded_chapters(
    app_handle: &AppHandle<Wry>,
    work_id: String,
) -> AppResult<HashMap<String, bool>> {
    let state = load_work_ui_state(app_handle, work_id)?;
    Ok(state.expanded_chapters)
}

pub fn save_expanded_chapters(
    app_handle: &AppHandle<Wry>,
    work_id: String,
    expanded: HashMap<String, bool>,
) -> AppResult<()> {
    let mut state = load_work_ui_state(app_handle, work_id.clone())?;
    state.expanded_chapters = expanded;
    save_work_ui_state(app_handle, work_id, state)
}

pub fn load_panel_sizes(app_handle: &AppHandle<Wry>) -> AppResult<Vec<f64>> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(PANEL_SIZES_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<Vec<f64>>(value).unwrap_or_else(|_| DEFAULT_PANEL_SIZES.to_vec())
    } else {
        DEFAULT_PANEL_SIZES.to_vec()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_panel_sizes(app_handle: &AppHandle<Wry>, sizes: Vec<f64>) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(sizes)?;
    store.set(PANEL_SIZES_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist panel sizes: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_inspector_collapsed(app_handle: &AppHandle<Wry>) -> AppResult<bool> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(INSPECTOR_COLLAPSED_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<bool>(value).unwrap_or(false)
    } else {
        false
    };

    store.close_resource();
    Ok(result)
}

pub fn save_inspector_collapsed(app_handle: &AppHandle<Wry>, collapsed: bool) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(collapsed)?;
    store.set(INSPECTOR_COLLAPSED_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist inspector collapsed: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_inspector_sections(app_handle: &AppHandle<Wry>) -> AppResult<HashMap<String, bool>> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(INSPECTOR_SECTIONS_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<HashMap<String, bool>>(value).unwrap_or_default()
    } else {
        HashMap::new()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_inspector_sections(
    app_handle: &AppHandle<Wry>,
    sections: HashMap<String, bool>,
) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(sections)?;
    store.set(INSPECTOR_SECTIONS_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist inspector sections: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_inspector_section_order(app_handle: &AppHandle<Wry>) -> AppResult<Vec<String>> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(INSPECTOR_SECTION_ORDER_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<Vec<String>>(value).unwrap_or_default()
    } else {
        Vec::new()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_inspector_section_order(
    app_handle: &AppHandle<Wry>,
    order: Vec<String>,
) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(order)?;
    store.set(INSPECTOR_SECTION_ORDER_KEY, value);
    store.save().map_err(|e| {
        AppError::Internal(format!("failed to persist inspector section order: {}", e))
    })?;
    store.close_resource();
    Ok(())
}

pub fn load_split_view_direction(app_handle: &AppHandle<Wry>) -> AppResult<String> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SPLIT_VIEW_DIRECTION_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<String>(value).unwrap_or_else(|_| "none".to_string())
    } else {
        "none".to_string()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_split_view_direction(app_handle: &AppHandle<Wry>, direction: String) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(direction)?;
    store.set(SPLIT_VIEW_DIRECTION_KEY, value);
    store.save().map_err(|e| {
        AppError::Internal(format!("failed to persist split view direction: {}", e))
    })?;
    store.close_resource();
    Ok(())
}

pub fn load_split_view_ratio(app_handle: &AppHandle<Wry>) -> AppResult<f64> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SPLIT_VIEW_RATIO_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<f64>(value).unwrap_or(0.5)
    } else {
        0.5
    };

    store.close_resource();
    Ok(result)
}

pub fn save_split_view_ratio(app_handle: &AppHandle<Wry>, ratio: f64) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(ratio)?;
    store.set(SPLIT_VIEW_RATIO_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist split view ratio: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_split_view_panes(app_handle: &AppHandle<Wry>) -> AppResult<SplitViewPanes> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SPLIT_VIEW_PANES_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<SplitViewPanes>(value).unwrap_or_default()
    } else {
        SplitViewPanes::default()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_split_view_panes(app_handle: &AppHandle<Wry>, panes: SplitViewPanes) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(panes)?;
    store.set(SPLIT_VIEW_PANES_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist split view panes: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_sidebar_sections(app_handle: &AppHandle<Wry>) -> AppResult<SidebarSections> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SIDEBAR_SECTIONS_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<SidebarSections>(value).unwrap_or_default()
    } else {
        SidebarSections::default()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_sidebar_sections(
    app_handle: &AppHandle<Wry>,
    sections: SidebarSections,
) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(sections)?;
    store.set(SIDEBAR_SECTIONS_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist sidebar sections: {}", e)))?;
    store.close_resource();
    Ok(())
}

pub fn load_sidebar_section_ratio(app_handle: &AppHandle<Wry>) -> AppResult<f64> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(SIDEBAR_SECTION_RATIO_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<f64>(value).unwrap_or(DEFAULT_SIDEBAR_SECTION_RATIO)
    } else {
        DEFAULT_SIDEBAR_SECTION_RATIO
    };

    store.close_resource();
    Ok(result)
}

pub fn save_sidebar_section_ratio(app_handle: &AppHandle<Wry>, ratio: f64) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(ratio)?;
    store.set(SIDEBAR_SECTION_RATIO_KEY, value);
    store.save().map_err(|e| {
        AppError::Internal(format!("failed to persist sidebar section ratio: {}", e))
    })?;
    store.close_resource();
    Ok(())
}

pub fn load_inspector_tab(app_handle: &AppHandle<Wry>) -> AppResult<String> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;

    let stored_value = store.get(INSPECTOR_TAB_KEY);
    let result = if let Some(value) = stored_value {
        serde_json::from_value::<String>(value).unwrap_or_else(|_| "meta".to_string())
    } else {
        "meta".to_string()
    };

    store.close_resource();
    Ok(result)
}

pub fn save_inspector_tab(app_handle: &AppHandle<Wry>, tab: String) -> AppResult<()> {
    let store = app_handle
        .store(APP_STATE_STORE_PATH)
        .map_err(|e| AppError::Internal(format!("failed to open app state store: {}", e)))?;
    let value = serde_json::to_value(tab)?;
    store.set(INSPECTOR_TAB_KEY, value);
    store
        .save()
        .map_err(|e| AppError::Internal(format!("failed to persist inspector tab: {}", e)))?;
    store.close_resource();
    Ok(())
}
