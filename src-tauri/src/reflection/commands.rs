use crate::json_store::{atomic_write_json, read_json_file};
use crate::reflection::dto::ReflectionModuleDto;
use std::path::PathBuf;
use tauri::State;

/// 反思模块后端状态。
///
/// 当前使用 seed/app data 下的 reflection.json 做最小聚合持久化。
pub struct ReflectionState {
    pub data_path: PathBuf,
}

fn seed_reflection() -> Result<ReflectionModuleDto, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_reflection(state: State<ReflectionState>) -> Result<ReflectionModuleDto, String> {
    if !state.data_path.exists() {
        return seed_reflection();
    }

    read_json_file(&state.data_path)
}

#[tauri::command]
pub fn save_reflection(
    state: State<ReflectionState>,
    reflection: ReflectionModuleDto,
) -> Result<(), String> {
    reflection.validate()?;
    atomic_write_json(&state.data_path, &reflection)
}

#[cfg(test)]
mod tests {
    use super::ReflectionModuleDto;

    #[test]
    fn rejects_empty_reflection_title() {
        let reflection: ReflectionModuleDto = serde_json::from_value(serde_json::json!({
            "entries": [
                {
                    "id": "reflection-1",
                    "date": "2026-06-20",
                    "title": "",
                    "excerpt": "excerpt",
                    "tags": ["tag"]
                }
            ],
            "draftExample": { "content": "", "tags": [] }
        }))
        .unwrap();

        let error = reflection.validate().unwrap_err();
        assert!(error.contains("missing title"));
    }
}
