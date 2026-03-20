use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct ChapterOutline {
    pub id: String,
    pub title: String,
    pub sort_order: i64,
    pub is_deleted: bool,
    pub word_count: i64,
}
