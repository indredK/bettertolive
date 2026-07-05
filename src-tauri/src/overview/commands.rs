use std::path::PathBuf;

use tauri::State;

/// 总览模块后端状态。
///
/// 当前总览只读使用 seed/app data JSON 聚合；后续需要用户可编辑时再补 save command。
pub struct OverviewState {
    pub data_path: PathBuf,
}

fn seed_overview() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("initial.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_overview(state: State<OverviewState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        return seed_overview();
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}
