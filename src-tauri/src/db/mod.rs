use std::{fs, path::PathBuf};

use anyhow::{Context, Result};
use sqlx::{
    migrate::Migrator,
    sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions},
};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

use crate::models::settings::Language;
use crate::models::Settings;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");
mod sample_works;
mod sample_works_en;
mod seed;

pub type DbPool = SqlitePool;

pub async fn init_pool(app_handle: &AppHandle) -> Result<DbPool> {
    let DbLocation {
        path: db_path,
        newly_created,
    } = prepare_db_path(app_handle)?;

    let connect_options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    MIGRATOR
        .run(&pool)
        .await
        .context("failed to run database migrations")?;

    if newly_created {
        let language = detect_language();
        seed::seed_initial_data(&pool, &language).await?;
        save_initial_language(app_handle, &language)?;
    }

    Ok(pool)
}

struct DbLocation {
    path: PathBuf,
    newly_created: bool,
}

fn prepare_db_path(app_handle: &AppHandle) -> Result<DbLocation> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .context("failed to resolve app data directory")?;
    fs::create_dir_all(&data_dir)
        .with_context(|| format!("failed to create data directory at {:?}", data_dir))?;

    let db_path = data_dir.join("shizuku-editor.db");
    let newly_created = !db_path.exists();

    Ok(DbLocation {
        path: db_path,
        newly_created,
    })
}

fn detect_language() -> Language {
    let locale = tauri_plugin_os::locale().unwrap_or_default();
    if locale.starts_with("ja") {
        Language::Ja
    } else {
        Language::En
    }
}

fn save_initial_language(app_handle: &AppHandle, language: &Language) -> Result<()> {
    let store = app_handle
        .store("settings.json")
        .context("failed to open settings store")?;

    let mut settings = if let Some(value) = store.get("settings") {
        serde_json::from_value::<Settings>(value).unwrap_or_default()
    } else {
        Settings::default()
    };

    settings.language = Some(language.clone());

    let value = serde_json::to_value(&settings)?;
    store.set("settings", value);
    store
        .save()
        .context("failed to save initial language setting")?;
    store.close_resource();

    Ok(())
}

pub mod test_utils {
    use super::*;

    pub async fn create_test_pool() -> Result<DbPool> {
        create_test_pool_internal(true).await
    }

    pub async fn create_test_pool_empty() -> Result<DbPool> {
        create_test_pool_internal(false).await
    }

    async fn create_test_pool_internal(with_seed_data: bool) -> Result<DbPool> {
        let connect_options = SqliteConnectOptions::new()
            .filename(":memory:")
            .create_if_missing(true)
            .foreign_keys(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(connect_options)
            .await?;

        MIGRATOR
            .run(&pool)
            .await
            .context("failed to run database migrations for test")?;

        if with_seed_data {
            seed::seed_initial_data(&pool, &Language::Ja).await?;
        }

        Ok(pool)
    }
}
