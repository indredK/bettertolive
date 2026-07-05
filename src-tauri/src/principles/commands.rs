use std::path::{Path, PathBuf};
use tauri::State;

/// 原则模块第一阶段后端状态。
///
/// 先用 app data 下的 principles.json 做最小持久化；后续可按开发文档继续拆成
/// SQLite schema 与细粒度 CRUD commands。
pub struct PrinciplesState {
    pub data_path: PathBuf,
}

fn seed_principles() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("initial.json")).map_err(|e| e.to_string())
}

fn temp_principles_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("principles.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_principles(state: State<PrinciplesState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_principles();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_principles(
    state: State<PrinciplesState>,
    principles: serde_json::Value,
) -> Result<(), String> {
    if let Some(parent) = state.data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&principles).map_err(|e| e.to_string())?;
    let temp_path = temp_principles_path(&state.data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, &state.data_path).map_err(|e| e.to_string())
}
