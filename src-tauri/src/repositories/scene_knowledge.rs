use uuid::Uuid;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::KnowledgeOutline;

pub async fn find_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<Vec<KnowledgeOutline>> {
    let knowledge_list = sqlx::query_as::<_, KnowledgeOutline>(
        r#"
        SELECT k.id, k.type_id, k.title, k.sort_order
        FROM knowledge k
        INNER JOIN scene_knowledge sk ON sk.knowledge_id = k.id
        WHERE sk.scene_id = ?
        ORDER BY sk.created_at ASC
        "#,
    )
    .bind(scene_id)
    .fetch_all(pool)
    .await?;

    Ok(knowledge_list)
}

pub async fn insert(pool: &DbPool, scene_id: &str, knowledge_id: &str) -> AppResult<String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"
        INSERT INTO scene_knowledge (id, scene_id, knowledge_id)
        VALUES (?, ?, ?)
        ON CONFLICT(scene_id, knowledge_id) DO NOTHING
        "#,
    )
    .bind(&id)
    .bind(scene_id)
    .bind(knowledge_id)
    .execute(pool)
    .await?;

    Ok(id)
}

pub async fn delete(pool: &DbPool, scene_id: &str, knowledge_id: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM scene_knowledge WHERE scene_id = ? AND knowledge_id = ?")
        .bind(scene_id)
        .bind(knowledge_id)
        .execute(pool)
        .await?;
    Ok(())
}
