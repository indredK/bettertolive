use serde::de::DeserializeOwned;
use serde::Serialize;
use std::path::{Path, PathBuf};

fn temp_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("data.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

pub fn read_json_file<T: DeserializeOwned>(data_path: &Path) -> Result<T, String> {
    let content = std::fs::read_to_string(data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn atomic_write_json<T: Serialize>(data_path: &Path, value: &T) -> Result<(), String> {
    atomic_write_json_with_hook(data_path, value, |_| Ok(()))
}

pub fn atomic_write_json_with_hook<T: Serialize>(
    data_path: &Path,
    value: &T,
    after_temp_write: impl FnOnce(&Path) -> Result<(), String>,
) -> Result<(), String> {
    if let Some(parent) = data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    let temp_path = temp_path(data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    let write_result = (|| {
        std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
        after_temp_write(&temp_path)?;
        std::fs::rename(&temp_path, data_path).map_err(|e| e.to_string())
    })();

    if write_result.is_err() && temp_path.exists() {
        let _ = std::fs::remove_file(&temp_path);
    }

    write_result
}

#[cfg(test)]
mod tests {
    use super::{atomic_write_json, atomic_write_json_with_hook, read_json_file};
    use std::path::PathBuf;

    fn unique_path(name: &str) -> PathBuf {
        let unique = format!("bettertolive-json-store-{name}-{}", uuid::Uuid::new_v4());
        std::env::temp_dir().join(unique)
    }

    #[test]
    fn atomic_write_keeps_original_file_when_hook_fails() {
        let data_path = unique_path("atomic-write");

        atomic_write_json(&data_path, &serde_json::json!({ "value": "original" })).unwrap();

        let error = atomic_write_json_with_hook(
            &data_path,
            &serde_json::json!({ "value": "next" }),
            |_| Err("injected failure".to_string()),
        )
        .unwrap_err();

        assert!(error.contains("injected failure"));

        let persisted: serde_json::Value = read_json_file(&data_path).unwrap();
        assert_eq!(persisted["value"], "original");

        if data_path.exists() {
            std::fs::remove_file(&data_path).unwrap();
        }
    }
}
