use crate::emotion::dto::EmotionModuleDto;
use crate::json_store::{atomic_write_json, read_json_file};
use std::path::PathBuf;
use tauri::State;

/// 情绪模块第一阶段后端状态。
///
/// 先用 app data 下的 emotion.json 做最小持久化；后续可按开发文档继续拆成
/// SQLite schema 与细粒度 CRUD commands。
pub struct EmotionState {
    pub data_path: PathBuf,
}

fn seed_emotion() -> Result<EmotionModuleDto, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_emotion(state: State<EmotionState>) -> Result<EmotionModuleDto, String> {
    if !state.data_path.exists() {
        return seed_emotion();
    }

    read_json_file(&state.data_path)
}

#[tauri::command]
pub fn save_emotion(state: State<EmotionState>, emotion: EmotionModuleDto) -> Result<(), String> {
    emotion.validate()?;
    atomic_write_json(&state.data_path, &emotion)
}

#[cfg(test)]
mod tests {
    use crate::emotion::dto::EmotionModuleDto;

    #[test]
    fn rejects_unknown_emotion_enum_value() {
        let result = serde_json::from_value::<EmotionModuleDto>(serde_json::json!({
            "checkIns": [
                {
                    "id": "emotion-checkin-1",
                    "date": "2026-06-20",
                    "summary": "summary",
                    "state": "不存在的状态",
                    "intensity": "5/10",
                    "bodySignal": "signal",
                    "tags": []
                }
            ],
            "trend": [],
            "triggers": [],
            "tools": [],
            "overview": {
                "windowLabel": "最近 7 天",
                "averageScore": 5.0,
                "topEmotionTags": [],
                "bestWindow": "",
                "worstWindow": "",
                "conclusion": ""
            },
            "timelineSegments": [],
            "loopPatterns": [],
            "lifestyleLinks": [],
            "environmentCues": [],
            "relationshipCues": [],
            "recoveryNotes": [],
            "ineffectiveActions": [],
            "minimalRecoverySteps": []
        }));

        assert!(result.is_err());
    }
}
