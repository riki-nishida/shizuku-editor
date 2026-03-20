use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::settings::Language;
use crate::models::{KnowledgeType, KnowledgeTypeOutline, Settings};
use crate::repositories::knowledge_type as repo;

const DEFAULT_ICON: &str = "EditPencil";

const COLOR_PALETTE: &[&str] = &[
    "#E57373", "#FFB74D", "#81C784", "#4DB6AC", "#64B5F6", "#BA68C8", "#90A4AE",
];

pub async fn get_knowledge_type(pool: &DbPool, type_id: &str) -> AppResult<KnowledgeType> {
    repo::find_by_id(pool, type_id).await
}

pub async fn get_knowledge_types_by_work(
    pool: &DbPool,
    work_id: &str,
) -> AppResult<Vec<KnowledgeTypeOutline>> {
    repo::find_by_work(pool, work_id).await
}

pub async fn create_knowledge_type(
    pool: &DbPool,
    work_id: &str,
    name: &str,
    color: Option<&str>,
    icon: Option<&str>,
) -> AppResult<String> {
    let max_sort_order = repo::find_max_sort_order(pool, work_id).await?;
    let new_sort_order = max_sort_order.unwrap_or(0) + 1;

    let icon = icon.unwrap_or(DEFAULT_ICON);
    let auto_color;
    let color = match color {
        Some(c) => Some(c),
        None => {
            auto_color = COLOR_PALETTE[new_sort_order as usize % COLOR_PALETTE.len()].to_string();
            Some(auto_color.as_str())
        }
    };

    repo::insert(pool, work_id, name, color, Some(icon), new_sort_order).await
}

pub async fn update_knowledge_type(
    pool: &DbPool,
    type_id: &str,
    name: Option<&str>,
    color: Option<&str>,
    icon: Option<&str>,
    sort_order: Option<i64>,
) -> AppResult<()> {
    repo::update(pool, type_id, name, color, icon, sort_order).await
}

pub async fn update_knowledge_type_sort_order(
    pool: &DbPool,
    type_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::update_sort_order(pool, type_id, new_sort_order).await
}

pub async fn delete_knowledge_type(pool: &DbPool, type_id: &str) -> AppResult<()> {
    repo::delete(pool, type_id).await
}

fn get_language(app_handle: &AppHandle) -> Language {
    if let Ok(store) = app_handle.store("settings.json") {
        if let Some(value) = store.get("settings") {
            if let Ok(settings) = serde_json::from_value::<Settings>(value) {
                if let Some(lang) = settings.language {
                    store.close_resource();
                    return lang;
                }
            }
        }
        store.close_resource();
    }
    Language::Ja
}

pub fn get_language_from_store(app_handle: &AppHandle) -> Language {
    get_language(app_handle)
}

pub async fn ensure_default_types(
    pool: &DbPool,
    work_id: &str,
    language: &Language,
) -> AppResult<()> {
    if repo::has_types(pool, work_id).await? {
        return Ok(());
    }

    match language {
        Language::En => {
            repo::insert(pool, work_id, "Characters", None, Some("User"), 0).await?;
            repo::insert(pool, work_id, "World", None, Some("Globe"), 1).await?;
            repo::insert(pool, work_id, "Places", None, Some("MapPin"), 2).await?;
        }
        Language::Ja => {
            repo::insert(pool, work_id, "登場人物", None, Some("User"), 0).await?;
            repo::insert(pool, work_id, "世界観", None, Some("Globe"), 1).await?;
            repo::insert(pool, work_id, "場所", None, Some("MapPin"), 2).await?;
        }
    }

    Ok(())
}
