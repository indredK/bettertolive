use std::path::{Path, PathBuf};
use tauri::State;

/// 未来蓝图模块第一阶段后端状态。
///
/// 先用 app data 下的 future.json 做最小持久化；后续如果拆成更细的
/// SQLite 表，前端仍优先消费同一个聚合蓝图对象。
pub struct FutureState {
    pub data_path: PathBuf,
}

fn seed_future() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

fn temp_future_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("future.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_future(state: State<FutureState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_future();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_future(state: State<FutureState>, future: serde_json::Value) -> Result<(), String> {
    if let Some(parent) = state.data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&future).map_err(|e| e.to_string())?;
    let temp_path = temp_future_path(&state.data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, &state.data_path).map_err(|e| e.to_string())
}
