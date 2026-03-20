use std::fs;
use std::path::PathBuf;

use chrono::{DateTime, Local};
use rusqlite::Connection;
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};
use crate::models::BackupInfo;

const BACKUP_DIR_NAME: &str = "backups";
const BACKUP_PREFIX: &str = "shizuku_backup_";
const DB_FILE_NAME: &str = "shizuku-editor.db";
const MAX_AUTO_BACKUPS: usize = 5;

fn verify_backup_integrity(backup_path: &PathBuf) -> AppResult<()> {
    let conn = Connection::open(backup_path).map_err(|e| {
        AppError::Internal(format!("Failed to open backup for integrity check: {}", e))
    })?;

    let result: String = conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| AppError::Internal(format!("Failed to run integrity check: {}", e)))?;

    if result != "ok" {
        return Err(AppError::Internal(format!(
            "Backup integrity check failed: {}",
            result
        )));
    }

    Ok(())
}

pub fn get_backup_dir(app_handle: &AppHandle) -> AppResult<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("failed to resolve app data directory: {}", e)))?;
    let backup_dir = data_dir.join(BACKUP_DIR_NAME);
    fs::create_dir_all(&backup_dir)?;
    Ok(backup_dir)
}

pub fn get_db_path(app_handle: &AppHandle) -> AppResult<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("failed to resolve app data directory: {}", e)))?;
    Ok(data_dir.join(DB_FILE_NAME))
}

pub async fn create_backup(
    app_handle: &AppHandle,
    pool: &SqlitePool,
    is_auto: bool,
) -> AppResult<BackupInfo> {
    let db_path = get_db_path(app_handle)?;
    let backup_dir = get_backup_dir(app_handle)?;

    if !db_path.exists() {
        return Err(AppError::NotFound(
            "Database file does not exist".to_string(),
        ));
    }

    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(pool)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to checkpoint WAL: {}", e)))?;

    let now: DateTime<Local> = Local::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let prefix = if is_auto { "auto_" } else { "" };
    let backup_filename = format!("{}{}{}.db", BACKUP_PREFIX, prefix, timestamp);
    let backup_path = backup_dir.join(&backup_filename);

    fs::copy(&db_path, &backup_path)?;

    if let Err(e) = verify_backup_integrity(&backup_path) {
        let _ = fs::remove_file(&backup_path);
        return Err(e);
    }

    let metadata = fs::metadata(&backup_path)?;

    if is_auto {
        cleanup_old_auto_backups(&backup_dir)?;
    }

    Ok(BackupInfo {
        filename: backup_filename,
        created_at: now.format("%Y-%m-%d %H:%M:%S").to_string(),
        size_bytes: metadata.len(),
    })
}

pub fn list_backups(app_handle: &AppHandle) -> AppResult<Vec<BackupInfo>> {
    let backup_dir = get_backup_dir(app_handle)?;

    let mut backups: Vec<BackupInfo> = fs::read_dir(&backup_dir)?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .starts_with(BACKUP_PREFIX)
        })
        .filter_map(|entry| {
            let metadata = entry.metadata().ok()?;
            let filename = entry.file_name().to_string_lossy().to_string();

            let timestamp_str = filename
                .strip_prefix(BACKUP_PREFIX)?
                .strip_prefix("auto_")
                .unwrap_or_else(|| filename.strip_prefix(BACKUP_PREFIX).unwrap_or(&filename))
                .strip_suffix(".db")?;

            let created_at = if let Ok(dt) =
                chrono::NaiveDateTime::parse_from_str(timestamp_str, "%Y%m%d_%H%M%S")
            {
                dt.format("%Y-%m-%d %H:%M:%S").to_string()
            } else {
                "Unknown".to_string()
            };

            Some(BackupInfo {
                filename,
                created_at,
                size_bytes: metadata.len(),
            })
        })
        .collect();

    backups.sort_by(|a, b| b.filename.cmp(&a.filename));

    Ok(backups)
}

pub fn restore_backup(app_handle: &AppHandle, backup_filename: &str) -> AppResult<()> {
    let db_path = get_db_path(app_handle)?;
    let backup_dir = get_backup_dir(app_handle)?;
    let backup_path = backup_dir.join(backup_filename);

    if !backup_path.exists() {
        return Err(AppError::NotFound(format!(
            "Backup file does not exist: {}",
            backup_filename
        )));
    }

    if !backup_filename.starts_with(BACKUP_PREFIX) || !backup_filename.ends_with(".db") {
        return Err(AppError::Validation(format!(
            "Invalid backup filename: {}",
            backup_filename
        )));
    }

    let now: DateTime<Local> = Local::now();
    let safety_filename = format!(
        "{}pre_restore_{}.db",
        BACKUP_PREFIX,
        now.format("%Y%m%d_%H%M%S")
    );
    let safety_path = backup_dir.join(&safety_filename);

    if db_path.exists() {
        fs::copy(&db_path, &safety_path)?;
    }

    fs::copy(&backup_path, &db_path)?;

    let wal_path = db_path.with_extension("db-wal");
    let shm_path = db_path.with_extension("db-shm");
    let _ = fs::remove_file(&wal_path);
    let _ = fs::remove_file(&shm_path);

    Ok(())
}

pub fn delete_backup(app_handle: &AppHandle, backup_filename: &str) -> AppResult<()> {
    let backup_dir = get_backup_dir(app_handle)?;
    let backup_path = backup_dir.join(backup_filename);

    if !backup_path.exists() {
        return Err(AppError::NotFound(format!(
            "Backup file does not exist: {}",
            backup_filename
        )));
    }

    if !backup_filename.starts_with(BACKUP_PREFIX) || !backup_filename.ends_with(".db") {
        return Err(AppError::Validation(format!(
            "Invalid backup filename: {}",
            backup_filename
        )));
    }

    fs::remove_file(&backup_path)?;

    Ok(())
}

fn cleanup_old_auto_backups(backup_dir: &PathBuf) -> AppResult<()> {
    let auto_prefix = format!("{}auto_", BACKUP_PREFIX);

    let mut auto_backups: Vec<_> = fs::read_dir(backup_dir)?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .starts_with(&auto_prefix)
        })
        .collect();

    auto_backups.sort_by_key(|b| std::cmp::Reverse(b.file_name()));

    for old_backup in auto_backups.into_iter().skip(MAX_AUTO_BACKUPS) {
        let _ = fs::remove_file(old_backup.path());
    }

    Ok(())
}

pub fn get_backup_dir_path(app_handle: &AppHandle) -> AppResult<String> {
    let backup_dir = get_backup_dir(app_handle)?;
    Ok(backup_dir.to_string_lossy().to_string())
}
