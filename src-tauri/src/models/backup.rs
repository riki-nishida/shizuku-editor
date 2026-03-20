use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BackupInfo {
    pub filename: String,
    pub created_at: String,
    pub size_bytes: u64,
}
