use crate::json_store::{atomic_write_json, read_json_file};
use serde::{Deserialize, Serialize};
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
const RELATIONSHIPS_SCHEMA_VERSION: u32 = 2;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct VersionedRelationshipsDocument {
    schema_version: u32,
    data: serde_json::Value,
}

fn seed_relationships() -> Result<serde_json::Value, String> {
    let mut relationships: serde_json::Value =
        serde_json::from_str(include_str!("seed.json")).map_err(|e| e.to_string())?;
    fill_missing_connection_roles(&mut relationships);
    Ok(relationships)
}

fn seed_relationships_document() -> Result<VersionedRelationshipsDocument, String> {
    Ok(VersionedRelationshipsDocument {
        schema_version: RELATIONSHIPS_SCHEMA_VERSION,
        data: seed_relationships()?,
    })
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

fn migrate_relationships_document(
    mut document: VersionedRelationshipsDocument,
) -> Result<VersionedRelationshipsDocument, String> {
    loop {
        match document.schema_version {
            1 => {
                remove_preset_relationship_connections(&mut document.data);
                add_missing_default_connections(&mut document.data)?;
                fill_missing_connection_roles(&mut document.data);
                document.schema_version = 2;
            }
            RELATIONSHIPS_SCHEMA_VERSION => return Ok(document),
            version => {
                return Err(format!(
                    "unsupported relationships schema version: {}",
                    version
                ))
            }
        }
    }
}

fn read_versioned_relationships_document(
    data_path: &Path,
) -> Result<(VersionedRelationshipsDocument, bool), String> {
    if !data_path.exists() {
        return Ok((seed_relationships_document()?, true));
    }

    let raw: serde_json::Value = read_json_file(data_path)?;
    let is_versioned = raw
        .get("schema_version")
        .and_then(|value| value.as_u64())
        .is_some()
        && raw.get("data").is_some();

    if is_versioned {
        let document: VersionedRelationshipsDocument =
            serde_json::from_value(raw).map_err(|e| e.to_string())?;
        let should_persist = document.schema_version != RELATIONSHIPS_SCHEMA_VERSION;
        return Ok((migrate_relationships_document(document)?, should_persist));
    }

    let document = migrate_relationships_document(VersionedRelationshipsDocument {
        schema_version: 1,
        data: raw,
    })?;

    Ok((document, true))
}

#[tauri::command]
pub fn get_relationships(state: State<RelationshipsState>) -> Result<serde_json::Value, String> {
    let (document, should_persist) = read_versioned_relationships_document(&state.data_path)?;

    if should_persist {
        atomic_write_json(&state.data_path, &document)?;
    }

    Ok(document.data)
}

fn save_relationships_to_path(
    data_path: &Path,
    relationships: &serde_json::Value,
) -> Result<(), String> {
    atomic_write_json(
        data_path,
        &VersionedRelationshipsDocument {
            schema_version: RELATIONSHIPS_SCHEMA_VERSION,
            data: relationships.clone(),
        },
    )
}

#[tauri::command]
pub fn save_relationships(
    state: State<RelationshipsState>,
    relationships: serde_json::Value,
) -> Result<(), String> {
    save_relationships_to_path(&state.data_path, &relationships)
}

#[cfg(test)]
mod tests {
    use super::read_versioned_relationships_document;
    use super::{VersionedRelationshipsDocument, RELATIONSHIPS_SCHEMA_VERSION};
    use std::path::PathBuf;

    fn unique_path(name: &str) -> PathBuf {
        let unique = format!("bettertolive-relationships-{name}-{}", uuid::Uuid::new_v4());
        std::env::temp_dir().join(unique)
    }

    #[test]
    fn legacy_plain_document_is_not_reset_to_seed() {
        let data_path = unique_path("legacy-no-reset");
        std::fs::write(
            &data_path,
            serde_json::to_string_pretty(&serde_json::json!({
                "circles": [],
                "patterns": [],
                "unsentNotes": [],
                "connections": []
            }))
            .unwrap(),
        )
        .unwrap();

        let (document, should_persist) = read_versioned_relationships_document(&data_path).unwrap();
        assert!(should_persist);
        assert_eq!(document.schema_version, RELATIONSHIPS_SCHEMA_VERSION);
        assert_eq!(document.data["circles"], serde_json::json!([]));
        assert_eq!(document.data["connections"], serde_json::json!([]));

        if data_path.exists() {
            std::fs::remove_file(&data_path).unwrap();
        }
    }

    #[test]
    fn legacy_document_is_migrated_to_versioned_envelope() {
        let data_path = unique_path("legacy-envelope");
        std::fs::write(
            &data_path,
            serde_json::to_string_pretty(&serde_json::json!({
                "circles": [
                    {
                        "id": "relationship-five-generation-family",
                        "title": "家庭",
                        "summary": "summary",
                        "entries": [
                            { "id": "source", "name": "源" },
                            { "id": "target", "name": "目标" }
                        ]
                    }
                ],
                "patterns": [],
                "unsentNotes": [],
                "connections": [
                    {
                        "id": "connection-1",
                        "sourceId": "source",
                        "targetId": "target",
                        "note": "note",
                        "strength": "中"
                    }
                ]
            }))
            .unwrap(),
        )
        .unwrap();

        let (document, should_persist) = read_versioned_relationships_document(&data_path).unwrap();
        assert!(should_persist);
        assert_eq!(document.schema_version, RELATIONSHIPS_SCHEMA_VERSION);
        assert_eq!(
            document.data["connections"][0]["roles"][0]["sourceRole"],
            serde_json::json!("源")
        );

        let envelope = VersionedRelationshipsDocument {
            schema_version: document.schema_version,
            data: document.data.clone(),
        };
        crate::json_store::atomic_write_json(&data_path, &envelope).unwrap();

        let persisted: VersionedRelationshipsDocument =
            crate::json_store::read_json_file(&data_path).unwrap();
        assert_eq!(persisted.schema_version, RELATIONSHIPS_SCHEMA_VERSION);
        assert!(persisted.data.get("circles").is_some());

        if data_path.exists() {
            std::fs::remove_file(&data_path).unwrap();
        }
    }
}
