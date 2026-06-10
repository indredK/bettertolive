use std::path::{Path, PathBuf};
use tauri::State;

/// 关系深化模块第一阶段后端状态。
///
/// 当前先用 app data 下的 relationships.json 做最小持久化；
/// 后续可按开发文档继续拆成 SQLite schema 与细粒度 CRUD commands。
pub struct RelationshipsState {
    pub data_path: PathBuf,
}

const FIVE_GENERATION_ROOT_ID: &str = "relationship-five-generation-family";
const PRESET_RELATIONSHIP_CONNECTION_IDS: &[&str] = &[
    "relationship-connection-generation-1-2",
    "relationship-connection-generation-2-3-grandfather",
    "relationship-connection-grandparents",
    "relationship-connection-generation-3-4-father",
    "relationship-connection-parents",
    "relationship-connection-generation-4-5-mother",
    "relationship-connection-father-self",
    "relationship-connection-self-partner",
    "relationship-connection-self-best-friend",
    "relationship-connection-self-new-friend",
    "relationship-connection-self-neighbor-friend",
    "relationship-connection-partner-best-friend",
];

fn seed_relationships() -> Result<serde_json::Value, String> {
    let mut relationships: serde_json::Value =
        serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())?;
    fill_missing_connection_roles(&mut relationships);
    Ok(relationships)
}

fn should_reset_to_current_seed(relationships: &serde_json::Value) -> bool {
    !relationships
        .get("circles")
        .and_then(|circles| circles.as_array())
        .map(|circles| {
            circles.iter().any(|circle| {
                circle
                    .get("id")
                    .and_then(|id| id.as_str())
                    .is_some_and(|id| id == FIVE_GENERATION_ROOT_ID)
            })
        })
        .unwrap_or(false)
}

fn backup_relationships(data_path: &Path) -> Result<(), String> {
    if !data_path.exists() {
        return Ok(());
    }

    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("relationships.json");
    let backup_path =
        data_path.with_file_name(format!("{file_name}.bak-before-five-generation-reset"));

    if backup_path.exists() {
        return Ok(());
    }

    std::fs::copy(data_path, backup_path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn remove_preset_relationship_connections(relationships: &mut serde_json::Value) -> bool {
    let Some(connections) = relationships
        .get_mut("connections")
        .and_then(|connections| connections.as_array_mut())
    else {
        return false;
    };

    let before_len = connections.len();
    connections.retain(|connection| {
        connection
            .get("id")
            .and_then(|id| id.as_str())
            .map(|id| !PRESET_RELATIONSHIP_CONNECTION_IDS.contains(&id))
            .unwrap_or(true)
    });

    connections.len() != before_len
}

fn has_five_generation_root(relationships: &serde_json::Value) -> bool {
    relationships
        .get("circles")
        .and_then(|circles| circles.as_array())
        .map(|circles| {
            circles.iter().any(|circle| {
                circle
                    .get("id")
                    .and_then(|id| id.as_str())
                    .is_some_and(|id| id == FIVE_GENERATION_ROOT_ID)
            })
        })
        .unwrap_or(false)
}

fn add_missing_default_connections(relationships: &mut serde_json::Value) -> Result<bool, String> {
    if !has_five_generation_root(relationships) {
        return Ok(false);
    }

    let seed = seed_relationships()?;
    let seed_connections = seed
        .get("connections")
        .and_then(|connections| connections.as_array())
        .cloned()
        .unwrap_or_default();

    if seed_connections.is_empty() {
        return Ok(false);
    }

    let Some(connections) = relationships
        .get_mut("connections")
        .and_then(|connections| connections.as_array_mut())
    else {
        relationships["connections"] = serde_json::Value::Array(seed_connections);
        return Ok(true);
    };

    let existing_pairs = connections
        .iter()
        .filter_map(connection_pair_key)
        .collect::<std::collections::HashSet<_>>();
    let missing_connections = seed_connections
        .into_iter()
        .filter(|connection| {
            connection_pair_key(connection)
                .map(|key| !existing_pairs.contains(&key))
                .unwrap_or(false)
        })
        .collect::<Vec<_>>();

    if missing_connections.is_empty() {
        return Ok(false);
    }

    connections.extend(missing_connections);
    Ok(true)
}

fn fill_missing_connection_roles(relationships: &mut serde_json::Value) -> bool {
    if !has_five_generation_root(relationships) {
        return false;
    }

    let relationship_names = relationship_name_lookup(relationships);
    let Some(connections) = relationships
        .get_mut("connections")
        .and_then(|connections| connections.as_array_mut())
    else {
        return false;
    };

    let mut changed = false;

    for connection in connections {
        if connection_has_visible_roles(connection) {
            continue;
        }

        let Some(source_id) = connection.get("sourceId").and_then(|id| id.as_str()) else {
            continue;
        };
        let Some(target_id) = connection.get("targetId").and_then(|id| id.as_str()) else {
            continue;
        };

        if source_id.is_empty() || target_id.is_empty() || source_id == target_id {
            continue;
        }

        let source_role = relationship_names
            .get(source_id)
            .map(String::as_str)
            .unwrap_or(source_id);
        let target_role = relationship_names
            .get(target_id)
            .map(String::as_str)
            .unwrap_or(target_id);
        let role = serde_json::json!({
            "id": format!("relationship-default-role-{source_id}-{target_id}"),
            "sourceRole": source_role,
            "targetRole": target_role,
            "note": "默认双向关系"
        });

        connection["roles"] = serde_json::Value::Array(vec![role]);
        changed = true;
    }

    changed
}

fn connection_has_visible_roles(connection: &serde_json::Value) -> bool {
    connection
        .get("roles")
        .and_then(|roles| roles.as_array())
        .map(|roles| {
            roles.iter().any(|role| {
                role.get("sourceRole")
                    .and_then(|source_role| source_role.as_str())
                    .is_some_and(|source_role| !source_role.trim().is_empty())
                    && role
                        .get("targetRole")
                        .and_then(|target_role| target_role.as_str())
                        .is_some_and(|target_role| !target_role.trim().is_empty())
            })
        })
        .unwrap_or(false)
}

fn relationship_name_lookup(
    relationships: &serde_json::Value,
) -> std::collections::HashMap<String, String> {
    relationships
        .get("circles")
        .and_then(|circles| circles.as_array())
        .into_iter()
        .flatten()
        .flat_map(|circle| {
            circle
                .get("entries")
                .and_then(|entries| entries.as_array())
                .into_iter()
                .flatten()
        })
        .filter_map(|entry| {
            let id = entry.get("id")?.as_str()?.trim();
            let name = entry.get("name")?.as_str()?.trim();

            if id.is_empty() || name.is_empty() {
                return None;
            }

            Some((id.to_string(), name.to_string()))
        })
        .collect()
}

fn connection_pair_key(connection: &serde_json::Value) -> Option<String> {
    let source_id = connection.get("sourceId").and_then(|id| id.as_str())?;
    let target_id = connection.get("targetId").and_then(|id| id.as_str())?;

    if source_id.is_empty() || target_id.is_empty() || source_id == target_id {
        return None;
    }

    if source_id <= target_id {
        Some(format!("{source_id}::{target_id}"))
    } else {
        Some(format!("{target_id}::{source_id}"))
    }
}

fn temp_relationships_path(data_path: &Path) -> PathBuf {
    let file_name = data_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("relationships.json");

    data_path.with_file_name(format!("{file_name}.tmp"))
}

#[tauri::command]
pub fn get_relationships(state: State<RelationshipsState>) -> Result<serde_json::Value, String> {
    if !state.data_path.exists() {
        let seed = seed_relationships()?;
        save_relationships_to_path(&state.data_path, &seed)?;
        return Ok(seed);
    }

    let content = std::fs::read_to_string(&state.data_path).map_err(|e| e.to_string())?;
    let mut relationships: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;

    if should_reset_to_current_seed(&relationships) {
        backup_relationships(&state.data_path)?;
        let seed = seed_relationships()?;
        save_relationships_to_path(&state.data_path, &seed)?;
        return Ok(seed);
    }

    let mut should_save_relationships = false;

    if remove_preset_relationship_connections(&mut relationships) {
        should_save_relationships = true;
    }

    if add_missing_default_connections(&mut relationships)? {
        should_save_relationships = true;
    }

    if fill_missing_connection_roles(&mut relationships) {
        should_save_relationships = true;
    }

    if should_save_relationships {
        backup_relationships(&state.data_path)?;
        save_relationships_to_path(&state.data_path, &relationships)?;
    }

    Ok(relationships)
}

fn save_relationships_to_path(
    data_path: &Path,
    relationships: &serde_json::Value,
) -> Result<(), String> {
    if let Some(parent) = data_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(relationships).map_err(|e| e.to_string())?;
    let temp_path = temp_relationships_path(data_path);

    if temp_path.exists() {
        std::fs::remove_file(&temp_path).map_err(|e| e.to_string())?;
    }

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;
    std::fs::rename(&temp_path, data_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_relationships(
    state: State<RelationshipsState>,
    relationships: serde_json::Value,
) -> Result<(), String> {
    save_relationships_to_path(&state.data_path, &relationships)
}
