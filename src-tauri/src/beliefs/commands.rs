use std::path::{Path, PathBuf};

use tauri::State;

use crate::beliefs::dto::{BeliefEntryDto, BeliefEntryFormDto, BeliefsModuleDto};
use crate::json_store::atomic_write_json;

/// 观念模块第一阶段后端状态。
///
/// 当前用 app data 下的 beliefs.json 做最小持久化；没有用户数据时读取模块 seed。
pub struct BeliefsState {
    pub data_path: PathBuf,
}

fn seed_beliefs() -> Result<BeliefsModuleDto, String> {
    serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())
}

fn temp_beliefs_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("beliefs.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

fn read_beliefs(data_path: &Path) -> Result<BeliefsModuleDto, String> {
    if !data_path.exists() {
        return seed_beliefs();
    }

    let content = std::fs::read_to_string(data_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_beliefs(data_path: &Path, beliefs: &BeliefsModuleDto) -> Result<(), String> {
    if let Some(parent) = data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(beliefs).map_err(|e| e.to_string())?;
    let temp_path = temp_beliefs_path(data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, data_path).map_err(|e| e.to_string())
}

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

fn normalize_unique_text(values: Vec<String>) -> Vec<String> {
    let mut normalized: Vec<String> = Vec::new();

    for value in values {
        let value = value.trim();
        if value.is_empty() || normalized.iter().any(|entry| entry.as_str() == value) {
            continue;
        }
        normalized.push(value.to_string());
    }

    normalized
}

fn entry_from_form(form: BeliefEntryFormDto, id: String) -> Result<BeliefEntryDto, String> {
    let title = form.title.trim().to_string();
    let statement = form.statement.trim().to_string();

    if title.is_empty() {
        return Err("title is required".to_string());
    }

    if statement.is_empty() {
        return Err("statement is required".to_string());
    }

    Ok(BeliefEntryDto {
        id,
        title,
        statement,
        description: form.description.trim().to_string(),
        domain: form.domain,
        layer: form.layer,
        stability: form.stability,
        source: form.source,
        impact: form.impact,
        secondary_domains: normalize_unique_text(form.secondary_domains),
        cbt_layer: clean_optional_text(form.cbt_layer),
        cognitive_distortions: normalize_unique_text(form.cognitive_distortions),
        defense_mechanism: clean_optional_text(form.defense_mechanism),
        attachment_note: clean_optional_text(form.attachment_note),
        revision_history: form.revision_history,
        tags: normalize_unique_text(form.tags),
    })
}

#[tauri::command]
#[specta::specta]
pub fn get_beliefs(state: State<BeliefsState>) -> Result<BeliefsModuleDto, String> {
    read_beliefs(&state.data_path)
}

#[tauri::command]
#[specta::specta]
pub fn create_belief_entry(
    state: State<BeliefsState>,
    form: BeliefEntryFormDto,
) -> Result<BeliefEntryDto, String> {
    let mut beliefs = read_beliefs(&state.data_path)?;
    let id = form
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    if beliefs.entries.iter().any(|entry| entry.id == id) {
        return Err("belief id already exists".to_string());
    }

    let entry = entry_from_form(form, id)?;
    beliefs.entries.push(entry.clone());
    write_beliefs(&state.data_path, &beliefs)?;

    Ok(entry)
}

#[tauri::command]
#[specta::specta]
pub fn update_belief_entry(
    state: State<BeliefsState>,
    form: BeliefEntryFormDto,
) -> Result<BeliefEntryDto, String> {
    let mut beliefs = read_beliefs(&state.data_path)?;
    let id = form.id.clone().ok_or("id is required for update")?;
    let updated = entry_from_form(form, id.clone())?;
    let index = beliefs
        .entries
        .iter()
        .position(|entry| entry.id == id)
        .ok_or("belief entry not found")?;

    beliefs.entries[index] = updated.clone();
    write_beliefs(&state.data_path, &beliefs)?;

    Ok(updated)
}

#[tauri::command]
#[specta::specta]
pub fn delete_belief_entry(state: State<BeliefsState>, id: String) -> Result<(), String> {
    let mut beliefs = read_beliefs(&state.data_path)?;
    let original_len = beliefs.entries.len();

    beliefs.entries.retain(|entry| entry.id != id);

    if beliefs.entries.len() == original_len {
        return Err("belief entry not found".to_string());
    }

    beliefs
        .relations
        .retain(|relation| relation.from_id != id && relation.to_id != id);

    write_beliefs(&state.data_path, &beliefs)
}

#[tauri::command]
#[specta::specta]
pub fn save_beliefs(state: State<BeliefsState>, beliefs: BeliefsModuleDto) -> Result<(), String> {
    atomic_write_json(&state.data_path, &beliefs)
}
