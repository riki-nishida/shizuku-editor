use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub scene_id: String,
    pub scene_title: String,
    pub chapter_id: String,
    pub chapter_title: String,
    pub line_number: i32,
    pub line_text: String,
    pub match_start: i32,
    pub match_end: i32,
    pub char_offset: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSearchResult {
    pub total_matches: i32,
    pub total_scenes: i32,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceResult {
    pub replaced_count: i32,
    pub affected_scenes: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub work_id: String,
    pub query: String,
    pub case_sensitive: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceRequest {
    pub work_id: String,
    pub search: String,
    pub replace: String,
    pub case_sensitive: bool,
    pub scene_ids: Option<Vec<String>>,
}
