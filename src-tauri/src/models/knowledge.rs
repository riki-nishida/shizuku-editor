use chrono::NaiveDateTime;
use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct Knowledge {
    pub id: String,
    pub type_id: String,
    pub title: String,
    pub body: String,
    pub plain_text: String,
    pub sort_order: i64,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct KnowledgeOutline {
    pub id: String,
    pub type_id: String,
    pub title: String,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct KnowledgeSearchResult {
    pub id: String,
    pub type_id: String,
    pub title: String,
    pub matched_text: String,
}
