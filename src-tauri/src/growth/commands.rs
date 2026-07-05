use crate::journey::commands::{load_growth_from_journey, save_growth_to_journey, JourneyState};
use std::path::PathBuf;
use tauri::State;

/// 成长模块后端状态。
///
/// 先用 seed/app data JSON 承载聚合数据，保持前端 live 模式不依赖 HTTP。
pub struct GrowthState {
    pub data_path: PathBuf,
}

pub(crate) fn seed_growth() -> Result<serde_json::Value, String> {
    serde_json::from_str(include_str!("initial.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_growth(
    state: State<GrowthState>,
    memory_state: State<crate::memory::commands::MemoryState>,
    journey_state: State<JourneyState>,
) -> Result<serde_json::Value, String> {
    load_growth_from_journey(&state, &memory_state, &journey_state)
}

#[tauri::command]
pub fn save_growth(
    state: State<GrowthState>,
    memory_state: State<crate::memory::commands::MemoryState>,
    journey_state: State<JourneyState>,
    growth: serde_json::Value,
) -> Result<(), String> {
    save_growth_to_journey(&state, &memory_state, &journey_state, growth)
}
