use crate::growth::commands::{seed_growth, GrowthState};
#[cfg(test)]
use crate::json_store::atomic_write_json_with_hook;
use crate::json_store::{atomic_write_json, read_json_file};
use crate::memory::commands::{seed_memory, MemoryState};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::State;

pub struct JourneyState {
    pub data_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JourneyDocument {
    pub growth: serde_json::Value,
    pub memory: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JourneyPayload {
    pub growth: serde_json::Value,
    pub memory: serde_json::Value,
}

fn read_json_or_seed(
    data_path: &Path,
    seed: impl FnOnce() -> Result<serde_json::Value, String>,
) -> Result<serde_json::Value, String> {
    if data_path.exists() {
        return read_json_file(data_path);
    }

    seed()
}

pub(crate) fn load_journey_document(
    journey_path: &Path,
    growth_path: &Path,
    memory_path: &Path,
) -> Result<JourneyDocument, String> {
    if journey_path.exists() {
        return read_json_file(journey_path);
    }

    Ok(JourneyDocument {
        growth: read_json_or_seed(growth_path, seed_growth)?,
        memory: read_json_or_seed(memory_path, seed_memory)?,
    })
}

fn persist_journey_document(data_path: &Path, document: &JourneyDocument) -> Result<(), String> {
    atomic_write_json(data_path, document)
}

#[cfg(test)]
fn persist_journey_document_with_hook(
    data_path: &Path,
    document: &JourneyDocument,
    after_temp_write: impl FnOnce(&Path) -> Result<(), String>,
) -> Result<(), String> {
    atomic_write_json_with_hook(data_path, document, after_temp_write)
}

#[tauri::command]
pub fn save_journey(state: State<JourneyState>, payload: JourneyPayload) -> Result<(), String> {
    persist_journey_document(
        &state.data_path,
        &JourneyDocument {
            growth: payload.growth,
            memory: payload.memory,
        },
    )
}

pub(crate) fn load_growth_from_journey(
    growth_state: &GrowthState,
    memory_state: &MemoryState,
    journey_state: &JourneyState,
) -> Result<serde_json::Value, String> {
    Ok(load_journey_document(
        &journey_state.data_path,
        &growth_state.data_path,
        &memory_state.data_path,
    )?
    .growth)
}

pub(crate) fn load_memory_from_journey(
    growth_state: &GrowthState,
    memory_state: &MemoryState,
    journey_state: &JourneyState,
) -> Result<serde_json::Value, String> {
    Ok(load_journey_document(
        &journey_state.data_path,
        &growth_state.data_path,
        &memory_state.data_path,
    )?
    .memory)
}

pub(crate) fn save_growth_to_journey(
    growth_state: &GrowthState,
    memory_state: &MemoryState,
    journey_state: &JourneyState,
    growth: serde_json::Value,
) -> Result<(), String> {
    let mut document = load_journey_document(
        &journey_state.data_path,
        &growth_state.data_path,
        &memory_state.data_path,
    )?;
    document.growth = growth;
    persist_journey_document(&journey_state.data_path, &document)
}

pub(crate) fn save_memory_to_journey(
    growth_state: &GrowthState,
    memory_state: &MemoryState,
    journey_state: &JourneyState,
    memory: serde_json::Value,
) -> Result<(), String> {
    let mut document = load_journey_document(
        &journey_state.data_path,
        &growth_state.data_path,
        &memory_state.data_path,
    )?;
    document.memory = memory;
    persist_journey_document(&journey_state.data_path, &document)
}

#[cfg(test)]
mod tests {
    use super::{persist_journey_document, persist_journey_document_with_hook, JourneyDocument};
    use crate::json_store::read_json_file;

    fn unique_path(name: &str) -> std::path::PathBuf {
        let unique = format!("bettertolive-journey-{name}-{}", uuid::Uuid::new_v4());
        std::env::temp_dir().join(unique)
    }

    #[test]
    fn injected_failure_keeps_previous_journey_document() {
        let path = unique_path("atomic");
        let original = JourneyDocument {
            growth: serde_json::json!({ "growthNodes": [{ "id": "growth-1" }] }),
            memory: serde_json::json!({ "memories": [{ "id": "memory-1" }] }),
        };

        persist_journey_document(&path, &original).unwrap();

        let next = JourneyDocument {
            growth: serde_json::json!({ "growthNodes": [{ "id": "growth-2" }] }),
            memory: serde_json::json!({ "memories": [{ "id": "memory-2" }] }),
        };

        let error = persist_journey_document_with_hook(&path, &next, |_| {
            Err("journey injected failure".to_string())
        })
        .unwrap_err();

        assert!(error.contains("journey injected failure"));

        let persisted: JourneyDocument = read_json_file(&path).unwrap();
        assert_eq!(persisted.growth["growthNodes"][0]["id"], "growth-1");
        assert_eq!(persisted.memory["memories"][0]["id"], "memory-1");

        if path.exists() {
            std::fs::remove_file(&path).unwrap();
        }
    }
}
