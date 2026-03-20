use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SceneImage {
    pub id: String,
    pub scene_id: String,
    pub file_path: String,
    pub file_name: String,
    pub file_size: i64,
    pub mime_type: String,
    pub sort_order: i64,
    pub created_at: String,
}
