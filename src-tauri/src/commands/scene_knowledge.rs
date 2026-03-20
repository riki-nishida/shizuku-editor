use tauri::State;

use crate::db::DbPool;
use crate::error::AppError;
use crate::models::KnowledgeOutline;
use crate::services::scene_knowledge;

#[tauri::command]
pub async fn get_scene_knowledge(
    pool: State<'_, DbPool>,
    scene_id: String,
) -> Result<Vec<KnowledgeOutline>, AppError> {
    scene_knowledge::get_by_scene(pool.inner(), &scene_id).await
}

#[tauri::command]
pub async fn link_knowledge_to_scene(
    pool: State<'_, DbPool>,
    scene_id: String,
    knowledge_id: String,
) -> Result<String, AppError> {
    scene_knowledge::link(pool.inner(), &scene_id, &knowledge_id).await
}

#[tauri::command]
pub async fn unlink_knowledge_from_scene(
    pool: State<'_, DbPool>,
    scene_id: String,
    knowledge_id: String,
) -> Result<(), AppError> {
    scene_knowledge::unlink(pool.inner(), &scene_id, &knowledge_id).await
}
