use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::db::DbPool;
use crate::error::{AppError, AppResult};
use crate::models::SceneImage;
use crate::repositories::scene_image as repo;

const SCENE_IMAGES_DIR: &str = "scene-images";
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

fn get_scene_image_dir(app_handle: &AppHandle, scene_id: &str) -> AppResult<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("Failed to resolve app data directory: {}", e)))?;
    let scene_image_dir = data_dir.join(SCENE_IMAGES_DIR).join(scene_id);
    Ok(scene_image_dir)
}

pub async fn get_by_scene(pool: &DbPool, scene_id: &str) -> AppResult<Vec<SceneImage>> {
    repo::find_by_scene(pool, scene_id).await
}

pub async fn add_image(
    pool: &DbPool,
    app_handle: &AppHandle,
    scene_id: &str,
    source_path: &str,
) -> AppResult<SceneImage> {
    let source = PathBuf::from(source_path);

    if !source.exists() {
        return Err(AppError::NotFound(format!(
            "Source file not found: {}",
            source_path
        )));
    }

    let metadata = fs::metadata(&source)?;
    let file_size = metadata.len();

    if file_size > MAX_FILE_SIZE {
        return Err(AppError::Validation(format!(
            "File size exceeds maximum allowed size of {}MB",
            MAX_FILE_SIZE / 1024 / 1024
        )));
    }

    let original_name = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| AppError::Validation("Invalid file name".into()))?
        .to_string();

    let extension = source.extension().and_then(|e| e.to_str()).unwrap_or("png");

    let mime_type = match extension.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "application/octet-stream",
    };

    let dest_dir = get_scene_image_dir(app_handle, scene_id)?;
    fs::create_dir_all(&dest_dir)?;

    let unique_name = format!("{}.{}", Uuid::new_v4(), extension);
    let dest_path = dest_dir.join(&unique_name);

    fs::copy(&source, &dest_path)?;

    let relative_path = format!("{}/{}/{}", SCENE_IMAGES_DIR, scene_id, unique_name);

    let image = repo::insert(
        pool,
        scene_id,
        &relative_path,
        &original_name,
        file_size as i64,
        mime_type,
    )
    .await?;

    Ok(image)
}

pub async fn delete_image(pool: &DbPool, app_handle: &AppHandle, image_id: &str) -> AppResult<()> {
    let image = repo::find_by_id(pool, image_id).await?;

    if let Some(img) = image {
        let data_dir = app_handle.path().app_data_dir().map_err(|e| {
            AppError::Internal(format!("Failed to resolve app data directory: {}", e))
        })?;
        let file_path = data_dir.join(&img.file_path);

        if file_path.exists() {
            fs::remove_file(&file_path)?;
        }

        repo::delete(pool, image_id).await?;
    }

    Ok(())
}

pub async fn update_sort_order(
    pool: &DbPool,
    image_id: &str,
    new_sort_order: i64,
) -> AppResult<()> {
    repo::update_sort_order(pool, image_id, new_sort_order).await
}

pub fn get_image_path(app_handle: &AppHandle, relative_path: &str) -> AppResult<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(format!("Failed to resolve app data directory: {}", e)))?;
    Ok(data_dir.join(relative_path))
}

pub async fn delete_by_scene(
    pool: &DbPool,
    app_handle: &AppHandle,
    scene_id: &str,
) -> AppResult<()> {
    let scene_image_dir = get_scene_image_dir(app_handle, scene_id)?;
    if scene_image_dir.exists() {
        fs::remove_dir_all(&scene_image_dir)?;
    }

    repo::delete_by_scene(pool, scene_id).await?;

    Ok(())
}
