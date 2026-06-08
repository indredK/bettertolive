use std::path::{Path, PathBuf};
use tauri::State;

/// 记事模块第一阶段后端状态。
///
/// 先使用 app data 下的 events.json 做最小持久化；页面侧只依赖聚合 JSON，
/// 后续需要更细粒度检索时再迁移到 SQLite。
pub struct EventsState {
    pub data_path: PathBuf,
}

fn seed_events() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

fn temp_events_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("events.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_events(state: State<EventsState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_events();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_events(state: State<EventsState>, events: serde_json::Value) -> Result<(), String> {
    if let Some(parent) = state.data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&events).map_err(|e| e.to_string())?;
    let temp_path = temp_events_path(&state.data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, &state.data_path).map_err(|e| e.to_string())
}
