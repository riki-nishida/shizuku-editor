use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentMarkup {
    Ruby {
        start: usize,
        end: usize,
        ruby: String,
    },
    EmphasisDot {
        start: usize,
        end: usize,
    },
    Annotation {
        start: usize,
        end: usize,
        id: String,
        comment: String,
    },
}

#[derive(Debug, Serialize, FromRow)]
pub struct Scene {
    pub id: String,
    pub chapter_id: String,
    pub title: String,
    pub synopsis: String,
    pub content_text: String,
    pub content_markups: String,
    pub word_count: i64,
    pub sort_order: i64,
    pub is_deleted: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct SceneOutline {
    pub id: String,
    pub chapter_id: String,
    pub title: String,
    pub sort_order: i64,
    pub is_deleted: bool,
    pub word_count: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct SceneSearchResult {
    pub id: String,
    pub chapter_id: String,
    pub title: String,
    pub matched_text: String,
}
