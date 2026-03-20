use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Serialize)]
pub struct SerializableError {
    pub code: &'static str,
    pub message: String,
}

impl From<&AppError> for SerializableError {
    fn from(error: &AppError) -> Self {
        let (code, message) = match error {
            AppError::Database(e) => ("DATABASE_ERROR", e.to_string()),
            AppError::NotFound(msg) => ("NOT_FOUND", msg.clone()),
            AppError::Validation(msg) => ("VALIDATION_ERROR", msg.clone()),
            AppError::Io(e) => ("IO_ERROR", e.to_string()),
            AppError::Serialization(e) => ("SERIALIZATION_ERROR", e.to_string()),
            AppError::Tauri(e) => ("TAURI_ERROR", e.to_string()),
            AppError::Internal(msg) => ("INTERNAL_ERROR", msg.clone()),
        };
        SerializableError { code, message }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        SerializableError::from(self).serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
