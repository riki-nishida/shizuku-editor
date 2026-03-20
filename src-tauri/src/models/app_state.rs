use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    #[serde(default)]
    pub selected_work_id: Option<String>,

    #[serde(default)]
    pub work_ui_states: HashMap<String, WorkUiState>,

    #[serde(default = "default_panel_sizes")]
    pub panel_sizes: Vec<f64>,

    #[serde(default)]
    pub inspector_collapsed: bool,

    #[serde(default)]
    pub inspector_sections: HashMap<String, bool>,

    #[serde(default)]
    pub inspector_section_order: Vec<String>,

    #[serde(default = "default_inspector_tab")]
    pub inspector_tab: String,

    #[serde(default = "default_split_view_direction")]
    pub split_view_direction: String,

    #[serde(default = "default_split_view_ratio")]
    pub split_view_ratio: f64,

    #[serde(default)]
    pub split_view_panes: SplitViewPanes,

    #[serde(default)]
    pub sidebar_sections: SidebarSections,

    #[serde(default = "default_sidebar_section_ratio")]
    pub sidebar_section_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkUiState {
    pub selected_node: Option<SelectedNode>,
    pub expanded_chapters: HashMap<String, bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitViewPanes {
    pub primary_scene_id: Option<String>,
    pub secondary_scene_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidebarSections {
    pub outline: bool,
    pub materials: bool,
}

impl Default for SidebarSections {
    fn default() -> Self {
        Self {
            outline: true,
            materials: true,
        }
    }
}

fn default_panel_sizes() -> Vec<f64> {
    vec![20.0, 60.0, 20.0]
}

fn default_inspector_tab() -> String {
    "meta".to_string()
}

fn default_split_view_direction() -> String {
    "none".to_string()
}

fn default_split_view_ratio() -> f64 {
    0.5
}

fn default_sidebar_section_ratio() -> f64 {
    0.6
}
