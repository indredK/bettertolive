use std::path::{Path, PathBuf};
use tauri::State;

/// 世界历史模块后端状态。
///
/// 与 relationships 一致，用 app data 下的 worldhistory.json 做最小持久化：
/// 首次读取写入 seed，之后整体读写，写操作走 tmp→rename 原子替换。
pub struct WorldHistoryState {
    pub data_path: PathBuf,
}

fn seed_world_history() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("initial.json")).map_err(|e| e.to_string())
}

fn temp_world_history_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("worldhistory.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

fn save_world_history_to_path(
    data_path: &Path,
    world_history: &serde_json::Value,
) -> Result<(), String> {
    if let Some(parent) = data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(world_history).map_err(|e| e.to_string())?;
    let temp_path = temp_world_history_path(data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, data_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_world_history(state: State<WorldHistoryState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        let seed = seed_world_history()?;
        save_world_history_to_path(&state.data_path, &seed)?;
        return Ok(seed);
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_world_history(
    state: State<WorldHistoryState>,
    world_history: serde_json::Value,
) -> Result<(), String> {
    save_world_history_to_path(&state.data_path, &world_history)
}
