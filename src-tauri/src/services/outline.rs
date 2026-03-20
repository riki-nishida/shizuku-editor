use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{WorkOutline, WorkStatistics};
use crate::repositories::outline as repo;

pub async fn get_work_outline(pool: &DbPool, work_id: &str) -> AppResult<WorkOutline> {
    repo::find_work_outline(pool, work_id).await
}

pub async fn get_work_statistics(pool: &DbPool, work_id: &str) -> AppResult<WorkStatistics> {
    repo::find_work_statistics(pool, work_id).await
}
