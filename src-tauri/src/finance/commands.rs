use std::path::{Path, PathBuf};
use tauri::State;

/// 记账模块第一阶段后端状态。
///
/// 当前先用 app data 下的 finance.json 做最小持久化；
/// 后续如果账目导入、筛选或聚合需求变复杂，再迁移到 SQLite 表。
pub struct FinanceState {
    pub data_path: PathBuf,
}

fn seed_finance() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

fn temp_finance_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("finance.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_finance(state: State<FinanceState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_finance();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_finance(state: State<FinanceState>, finance: serde_json::Value) -> Result<(), String> {
    if let Some(parent) = state.data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&finance).map_err(|e| e.to_string())?;
    let temp_path = temp_finance_path(&state.data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, &state.data_path).map_err(|e| e.to_string())
}
