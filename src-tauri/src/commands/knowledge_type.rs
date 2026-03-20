use tauri::{AppHandle, State};

use crate::error::AppError;
use crate::{
    db::DbPool,
    models::{KnowledgeType, KnowledgeTypeOutline},
    services::knowledge_type,
};

#[tauri::command]
pub async fn get_knowledge_type(
    pool: State<'_, DbPool>,
    type_id: String,
) -> Result<KnowledgeType, AppError> {
    knowledge_type::get_knowledge_type(pool.inner(), &type_id).await
}

#[tauri::command]
pub async fn get_knowledge_types_by_work(
    pool: State<'_, DbPool>,
    work_id: String,
) -> Result<Vec<KnowledgeTypeOutline>, AppError> {
    knowledge_type::get_knowledge_types_by_work(pool.inner(), &work_id).await
}

#[tauri::command]
pub async fn create_knowledge_type(
    pool: State<'_, DbPool>,
    work_id: String,
    name: String,
    color: Option<String>,
    icon: Option<String>,
) -> Result<String, AppError> {
    knowledge_type::create_knowledge_type(
        pool.inner(),
        &work_id,
        &name,
        color.as_deref(),
        icon.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn update_knowledge_type(
    pool: State<'_, DbPool>,
    type_id: String,
    name: Option<String>,
    color: Option<String>,
    icon: Option<String>,
    sort_order: Option<i64>,
) -> Result<(), AppError> {
    knowledge_type::update_knowledge_type(
        pool.inner(),
        &type_id,
        name.as_deref(),
        color.as_deref(),
        icon.as_deref(),
        sort_order,
    )
    .await
}

#[tauri::command]
pub async fn update_knowledge_type_sort_order(
    pool: State<'_, DbPool>,
    type_id: String,
    new_sort_order: i64,
) -> Result<(), AppError> {
    knowledge_type::update_knowledge_type_sort_order(pool.inner(), &type_id, new_sort_order).await
}

#[tauri::command]
pub async fn delete_knowledge_type(
    pool: State<'_, DbPool>,
    type_id: String,
) -> Result<(), AppError> {
    knowledge_type::delete_knowledge_type(pool.inner(), &type_id).await
}

#[tauri::command]
pub async fn ensure_default_knowledge_types(
    app_handle: AppHandle,
    pool: State<'_, DbPool>,
    work_id: String,
) -> Result<(), AppError> {
    let language = knowledge_type::get_language_from_store(&app_handle);
    knowledge_type::ensure_default_types(pool.inner(), &work_id, &language).await
}
