use tauri::State;

use crate::error::AppError;
use crate::{
    db::DbPool,
    models::{Knowledge, KnowledgeOutline, KnowledgeSearchResult},
    services::knowledge,
};

#[tauri::command]
pub async fn get_knowledge(
    pool: State<'_, DbPool>,
    knowledge_id: String,
) -> Result<Knowledge, AppError> {
    knowledge::get_knowledge(pool.inner(), &knowledge_id).await
}

#[tauri::command]
pub async fn get_knowledge_by_work(
    pool: State<'_, DbPool>,
    work_id: String,
) -> Result<Vec<KnowledgeOutline>, AppError> {
    knowledge::get_knowledge_by_work(pool.inner(), &work_id).await
}

#[tauri::command]
pub async fn create_knowledge(
    pool: State<'_, DbPool>,
    type_id: String,
    title: String,
) -> Result<String, AppError> {
    knowledge::create_knowledge(pool.inner(), &type_id, &title).await
}

#[tauri::command]
pub async fn update_knowledge_title(
    pool: State<'_, DbPool>,
    knowledge_id: String,
    title: String,
) -> Result<(), AppError> {
    knowledge::update_knowledge_title(pool.inner(), &knowledge_id, &title).await
}

#[tauri::command]
pub async fn update_knowledge_body(
    pool: State<'_, DbPool>,
    knowledge_id: String,
    body: String,
    plain_text: String,
) -> Result<(), AppError> {
    knowledge::update_knowledge_body(pool.inner(), &knowledge_id, &body, &plain_text).await
}

#[tauri::command]
pub async fn update_knowledge_sort_order(
    pool: State<'_, DbPool>,
    knowledge_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    knowledge::update_knowledge_sort_order(pool.inner(), &knowledge_id, new_sort_order).await
}

#[tauri::command]
pub async fn update_knowledge_type_id(
    pool: State<'_, DbPool>,
    knowledge_id: String,
    type_id: String,
) -> Result<(), AppError> {
    knowledge::update_knowledge_type(pool.inner(), &knowledge_id, &type_id).await
}

#[tauri::command]
pub async fn get_knowledge_by_type(
    pool: State<'_, DbPool>,
    type_id: String,
) -> Result<Vec<KnowledgeOutline>, AppError> {
    knowledge::get_knowledge_by_type(pool.inner(), &type_id).await
}

#[tauri::command]
pub async fn delete_knowledge(
    pool: State<'_, DbPool>,
    knowledge_id: String,
) -> Result<(), AppError> {
    knowledge::delete_knowledge(pool.inner(), &knowledge_id).await
}

#[tauri::command]
pub async fn search_knowledge(
    pool: State<'_, DbPool>,
    work_id: String,
    query: String,
) -> Result<Vec<KnowledgeSearchResult>, AppError> {
    knowledge::search_knowledge(pool.inner(), &work_id, &query).await
}
