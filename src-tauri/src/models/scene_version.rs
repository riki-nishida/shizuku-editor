use chrono::NaiveDateTime;
use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct SceneVersion {
    pub id: String,
    pub scene_id: String,
    pub content_text: String,
    pub content_markups: String,
    pub label: Option<String>,
    pub created_at: NaiveDateTime,
}
