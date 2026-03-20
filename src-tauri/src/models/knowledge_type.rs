use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct KnowledgeType {
    pub id: String,
    pub work_id: String,
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: i64,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct KnowledgeTypeOutline {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: i64,
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateKnowledgeTypePayload {
    pub work_id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateKnowledgeTypePayload {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<i64>,
}
