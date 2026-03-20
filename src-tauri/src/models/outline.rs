use serde::Serialize;
use sqlx::FromRow;

use super::{ChapterOutline, SceneOutline};

#[derive(Debug, Serialize)]
pub struct WorkOutline {
    pub chapters: Vec<ChapterOutline>,
    pub scenes: Vec<SceneOutline>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct WorkStatistics {
    pub total_word_count: i64,
    pub scene_count: i64,
    pub chapter_count: i64,
}
