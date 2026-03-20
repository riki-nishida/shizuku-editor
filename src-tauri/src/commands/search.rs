use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{ProjectSearchResult, ReplaceResult};
use crate::services::search;

#[tauri::command]
pub async fn search_project(
    pool: State<'_, DbPool>,
    work_id: String,
    query: String,
    case_sensitive: bool,
) -> Result<ProjectSearchResult, AppError> {
    search::search_project(pool.inner(), &work_id, &query, case_sensitive).await
}

#[tauri::command]
pub async fn replace_in_project(
    pool: State<'_, DbPool>,
    work_id: String,
    search_text: String,
    replace_text: String,
    case_sensitive: bool,
    scene_ids: Option<Vec<String>>,
) -> Result<ReplaceResult, AppError> {
    search::replace_in_project(
        pool.inner(),
        &work_id,
        &search_text,
        &replace_text,
        case_sensitive,
        scene_ids,
    )
    .await
}
