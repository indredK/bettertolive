use crate::journey::commands::{load_memory_from_journey, save_memory_to_journey, JourneyState};
use std::path::PathBuf;
use tauri::State;

/// 记忆模块后端状态。
///
/// 先用 seed/app data JSON 承载聚合数据，保持前端 live 模式不依赖 HTTP。
pub struct MemoryState {
    pub data_path: PathBuf,
}

pub(crate) fn seed_memory() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_memory(
    state: State<MemoryState>,
    growth_state: State<crate::growth::commands::GrowthState>,
    journey_state: State<JourneyState>,
) -> Result<serde_json::Value, String> {
    load_memory_from_journey(&growth_state, &state, &journey_state)
}

#[tauri::command]
pub fn save_memory(
    state: State<MemoryState>,
    growth_state: State<crate::growth::commands::GrowthState>,
    journey_state: State<JourneyState>,
    memory: serde_json::Value,
) -> Result<(), String> {
    save_memory_to_journey(&growth_state, &state, &journey_state, memory)
}
