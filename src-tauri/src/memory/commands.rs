use std::path::{Path, PathBuf};

use tauri::State;

/// 记忆模块后端状态。
///
/// 先用 seed/app data JSON 承载聚合数据，保持前端 live 模式不依赖 HTTP。
pub struct MemoryState {
    pub data_path: PathBuf,
}

fn seed_memory() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

fn temp_memory_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("memory.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_memory(state: State<MemoryState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_memory();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_memory(state: State<MemoryState>, memory: serde_json::Value) -> Result<(), String> {
    if let Some(parent) = state.data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&memory).map_err(|e| e.to_string())?;
    let temp_path = temp_memory_path(&state.data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, &state.data_path).map_err(|e| e.to_string())
}
