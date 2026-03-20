use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::KnowledgeOutline;
use crate::repositories::scene_knowledge as repo;

pub async fn get_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<Vec<KnowledgeOutline>> {
    repo::find_by_scene(pool, scene_id).await
}

pub async fn link(pool: &DbPool, scene_id: &str, knowledge_id: &str) -> AppResult<String> {
    repo::insert(pool, scene_id, knowledge_id).await
}

pub async fn unlink(pool: &DbPool, scene_id: &str, knowledge_id: &str) -> AppResult<()> {
    repo::delete(pool, scene_id, knowledge_id).await
}
