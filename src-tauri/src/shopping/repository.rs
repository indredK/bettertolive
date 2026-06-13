#![allow(clippy::too_many_arguments, clippy::type_complexity)]

use crate::shopping::dto::{
    ShoppingAttributeDefinitionDto, ShoppingBoundaryEntryDto, ShoppingItemChildChannelDto,
    ShoppingItemChildDto, ShoppingItemDto, ShoppingLifestyleCollectionDto, ShoppingModuleDto,
    ShoppingOverviewDimensionPulseDto, ShoppingOverviewDto, ShoppingOverviewStagePulseDto,
    ShoppingSpaceDefinitionDto, ShoppingSpotlightDto, ShoppingStageItemDto,
    ShoppingStageItemTiersDto, ShoppingStageTemplateDto, ShoppingSystemDefinitionDto,
};
use crate::shopping::models::{
    AttributeDefinitionRow, ItemChildWriteModel, ItemRow, PageContentRow, SpaceDefinitionRow,
    StageItemRow, StageTemplateRow, SystemDefinitionRow,
};
use rusqlite::{params, Connection};
use std::collections::HashSet;

pub struct ShoppingRepository;

// ===== 行→struct 映射 =====

fn row_to_system_definition(row: &rusqlite::Row) -> rusqlite::Result<SystemDefinitionRow> {
    Ok(SystemDefinitionRow {
        id: row.get("id")?,
        name: row.get("name")?,
        summary: row.get("summary")?,
        key_question: row.get("key_question")?,
        secondary_groups_json: row.get("secondary_groups_json")?,
        sort_order: row.get("sort_order")?,
        is_enabled: row.get("is_enabled")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_space_definition(row: &rusqlite::Row) -> rusqlite::Result<SpaceDefinitionRow> {
    Ok(SpaceDefinitionRow {
        id: row.get("id")?,
        name: row.get("name")?,
        note: row.get("note")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_attribute_definition(row: &rusqlite::Row) -> rusqlite::Result<AttributeDefinitionRow> {
    Ok(AttributeDefinitionRow {
        id: row.get("id")?,
        kind: row.get("kind")?,
        code: row.get("code")?,
        semantic_key: row.get("semantic_key")?,
        label: row.get("label")?,
        label_en: row.get("label_en")?,
        description: row.get("description")?,
        style_token: row.get("style_token")?,
        rank: row.get("rank")?,
        sort_order: row.get("sort_order")?,
        is_enabled: row.get("is_enabled")?,
        is_system: row.get("is_system")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_item(row: &rusqlite::Row) -> rusqlite::Result<ItemRow> {
    Ok(ItemRow {
        id: row.get("id")?,
        name: row.get("name")?,
        status: row.get("status")?,
        lifecycle: row.get("lifecycle")?,
        depreciation: row.get("depreciation")?,
        entry_price: row.get("entry_price")?,
        sweet_spot_price: row.get("sweet_spot_price")?,
        overpay_price: row.get("overpay_price")?,
        note: row.get("note")?,
        quantity: row.get("quantity")?,
        replacement_cue: row.get("replacement_cue")?,
        reason: row.get("reason")?,
        target_lifestyle: row.get("target_lifestyle")?,
        current_price: row.get("current_price")?,
        buy_below_price: row.get("buy_below_price")?,
        keywords_json: row.get("keywords_json")?,
        sort_order: row.get("sort_order")?,
        is_archived: row.get("is_archived")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_stage_template(row: &rusqlite::Row) -> rusqlite::Result<StageTemplateRow> {
    Ok(StageTemplateRow {
        id: row.get("id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        focus: row.get("focus")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_stage_item(row: &rusqlite::Row) -> rusqlite::Result<StageItemRow> {
    Ok(StageItemRow {
        id: row.get("id")?,
        stage_template_id: row.get("stage_template_id")?,
        item_id: row.get("item_id")?,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_page_content(row: &rusqlite::Row) -> rusqlite::Result<PageContentRow> {
    Ok(PageContentRow {
        id: row.get("id")?,
        content_type: row.get("content_type")?,
        title: row.get("title")?,
        stage: row.get("stage")?,
        system_id: row.get("system_id")?,
        summary: row.get("summary")?,
        reason: row.get("reason")?,
        body_json: row.get("body_json")?,
        sort_order: row.get("sort_order")?,
        is_enabled: row.get("is_enabled")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

impl ShoppingRepository {
    const SUPPORTED_ATTRIBUTE_KINDS: [&'static str; 4] =
        ["status", "lifecycle", "depreciation", "channel"];

    const REQUIRED_STATUS_SEMANTICS: [&'static str; 2] = ["owned", "wanted"];

    fn count_to_i32(count: usize) -> i32 {
        i32::try_from(count).unwrap_or(i32::MAX)
    }

    fn normalize_unique_ids(ids: &[String]) -> Vec<String> {
        let mut seen = HashSet::new();
        ids.iter()
            .filter(|id| seen.insert((*id).clone()))
            .cloned()
            .collect()
    }

    fn id_exists(
        conn: &Connection,
        table: &str,
        id_column: &str,
        id: &str,
    ) -> Result<bool, String> {
        let sql = format!("SELECT EXISTS(SELECT 1 FROM {table} WHERE {id_column} = ?1)");
        conn.query_row(&sql, params![id], |row| row.get::<_, bool>(0))
            .map_err(|e| e.to_string())
    }

    fn normalize_attribute_kind(kind: &str) -> Result<String, String> {
        let normalized = kind.trim();
        if Self::SUPPORTED_ATTRIBUTE_KINDS.contains(&normalized) {
            Ok(normalized.to_string())
        } else {
            Err(format!("unsupported attribute kind: {kind}"))
        }
    }

    fn row_to_attribute_definition_dto(
        row: AttributeDefinitionRow,
    ) -> ShoppingAttributeDefinitionDto {
        ShoppingAttributeDefinitionDto {
            id: row.id,
            kind: row.kind,
            code: row.code,
            semantic_key: row.semantic_key,
            label: row.label,
            label_en: row.label_en,
            description: row.description,
            style_token: row.style_token,
            rank: row.rank,
            sort_order: row.sort_order,
            is_enabled: row.is_enabled,
            is_system: row.is_system,
        }
    }

    fn validate_attribute_semantic(kind: &str, semantic_key: Option<&str>) -> Result<(), String> {
        let normalized_semantic = semantic_key
            .map(str::trim)
            .filter(|value| !value.is_empty());
        match kind {
            "status" => {
                let Some(key) = normalized_semantic else {
                    return Err("status requires semanticKey".to_string());
                };
                if Self::REQUIRED_STATUS_SEMANTICS.contains(&key) {
                    Ok(())
                } else {
                    Err(format!("invalid status semanticKey: {key}"))
                }
            }
            _ => Ok(()),
        }
    }

    fn attribute_code_exists(conn: &Connection, kind: &str, code: &str) -> Result<bool, String> {
        conn.query_row(
            "SELECT EXISTS(
                SELECT 1
                FROM shopping_attribute_definitions
                WHERE kind = ?1 AND code = ?2 AND is_enabled = 1
            )",
            params![kind, code],
            |row| row.get::<_, bool>(0),
        )
        .map_err(|e| e.to_string())
    }

    fn require_enabled_attribute_code(
        conn: &Connection,
        kind: &str,
        code: Option<&str>,
        required: bool,
    ) -> Result<Option<String>, String> {
        let normalized = code.map(str::trim).filter(|value| !value.is_empty());
        match normalized {
            Some(value) => {
                if Self::attribute_code_exists(conn, kind, value)? {
                    Ok(Some(value.to_string()))
                } else {
                    Err(format!("invalid {kind}: {value}"))
                }
            }
            None if required => Err(format!("{kind} is required")),
            None => Ok(None),
        }
    }

    fn ensure_required_semantic_keys(conn: &Connection, kind: &str) -> Result<(), String> {
        let required = match kind {
            "status" => Self::REQUIRED_STATUS_SEMANTICS.as_slice(),
            _ => return Ok(()),
        };

        for semantic_key in required {
            let exists = conn
                .query_row(
                    "SELECT EXISTS(
                        SELECT 1 FROM shopping_attribute_definitions
                        WHERE kind = ?1 AND semantic_key = ?2 AND is_enabled = 1
                    )",
                    params![kind, semantic_key],
                    |row| row.get::<_, bool>(0),
                )
                .map_err(|e| e.to_string())?;
            if !exists {
                return Err(format!(
                    "missing required semanticKey for {kind}: {semantic_key}"
                ));
            }
        }

        Ok(())
    }

    fn normalize_optional_reference(
        conn: &Connection,
        table: &str,
        id_column: &str,
        value: Option<&str>,
    ) -> Result<Option<String>, String> {
        let Some(id) = value.map(str::trim).filter(|id| !id.is_empty()) else {
            return Ok(None);
        };

        if Self::id_exists(conn, table, id_column, id)? {
            Ok(Some(id.to_string()))
        } else {
            Ok(None)
        }
    }

    fn list_child_ids_for_item(
        conn: &Connection,
        item_id: &str,
    ) -> Result<HashSet<String>, String> {
        let mut stmt = conn
            .prepare("SELECT id FROM shopping_item_children WHERE item_id = ?1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        let mut ids = HashSet::new();
        for row in rows {
            ids.insert(row.map_err(|e| e.to_string())?);
        }
        Ok(ids)
    }

    fn normalize_stage_items(
        conn: &Connection,
        items: &[(String, Vec<String>, Vec<String>, Vec<String>)],
    ) -> Result<Vec<(String, Vec<String>, Vec<String>, Vec<String>)>, String> {
        let mut normalized = Vec::new();
        let mut seen_item_ids = HashSet::new();

        for (item_id, low, base, up) in items {
            if !seen_item_ids.insert(item_id.clone()) {
                continue;
            }
            if !Self::id_exists(conn, "shopping_items", "id", item_id)? {
                continue;
            }

            let valid_child_ids = Self::list_child_ids_for_item(conn, item_id)?;
            let normalize_tier = |tier_ids: &[String]| {
                let mut seen_child_ids = HashSet::new();
                tier_ids
                    .iter()
                    .filter(|child_id| {
                        valid_child_ids.contains(*child_id)
                            && seen_child_ids.insert((*child_id).clone())
                    })
                    .cloned()
                    .collect::<Vec<_>>()
            };

            normalized.push((
                item_id.clone(),
                normalize_tier(low),
                normalize_tier(base),
                normalize_tier(up),
            ));
        }

        Ok(normalized)
    }

    fn derive_stage_dimension_ids(
        conn: &Connection,
        item_ids: &[String],
    ) -> Result<(Vec<String>, Vec<String>), String> {
        let mut system_ids = Vec::new();
        let mut space_ids = Vec::new();

        for item_id in item_ids {
            system_ids.extend(Self::list_system_tags_for_item(conn, item_id)?);
            space_ids.extend(Self::list_space_tags_for_item(conn, item_id)?);
        }

        Ok((
            Self::normalize_unique_ids(&system_ids),
            Self::normalize_unique_ids(&space_ids),
        ))
    }

    fn delete_stage_tiers_for_item_children(
        conn: &Connection,
        item_id: &str,
    ) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_stage_item_tiers
             WHERE item_child_id IN (
                 SELECT id FROM shopping_item_children WHERE item_id = ?1
             )",
            params![item_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn delete_stage_records_for_item(conn: &Connection, item_id: &str) -> Result<(), String> {
        Self::delete_stage_tiers_for_item_children(conn, item_id)?;
        conn.execute(
            "DELETE FROM shopping_stage_items WHERE item_id = ?1",
            params![item_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ===== 聚合:返回完整 ShoppingModuleDto =====

    pub fn get_shopping_module_aggregated(conn: &Connection) -> Result<ShoppingModuleDto, String> {
        let system_definitions = Self::list_system_definitions_dto(conn)?;
        let space_definitions = Self::list_space_definitions_dto(conn)?;
        let attribute_definitions = Self::list_attribute_definitions_dto(conn)?;
        let items = Self::list_items_dto(conn)?;
        let stage_templates = Self::list_stage_templates_dto(conn)?;
        let spotlights = Self::list_spotlights(conn)?;
        let boundary_entries = Self::list_boundary_entries(conn)?;
        let lifestyle_collections = Self::list_lifestyle_collections(conn)?;
        let overview = Self::build_shopping_overview(
            &items,
            &system_definitions,
            &space_definitions,
            &stage_templates,
            &spotlights,
            &boundary_entries,
            &lifestyle_collections,
        );

        Ok(ShoppingModuleDto {
            overview,
            system_definitions,
            space_definitions,
            attribute_definitions,
            items,
            stage_templates,
            spotlights,
            boundary_entries,
            lifestyle_collections,
        })
    }

    fn build_shopping_overview(
        items: &[ShoppingItemDto],
        system_definitions: &[ShoppingSystemDefinitionDto],
        space_definitions: &[ShoppingSpaceDefinitionDto],
        stage_templates: &[ShoppingStageTemplateDto],
        spotlights: &[ShoppingSpotlightDto],
        boundary_entries: &[ShoppingBoundaryEntryDto],
        lifestyle_collections: &[ShoppingLifestyleCollectionDto],
    ) -> ShoppingOverviewDto {
        let owned_items = items
            .iter()
            .filter(|item| {
                if item.children.is_empty() {
                    true
                } else {
                    item.children
                        .iter()
                        .all(|child| child.status.as_deref() != Some("Wanted"))
                }
            })
            .count();
        let wanted_items = items
            .iter()
            .filter(|item| {
                item.children
                    .iter()
                    .any(|child| child.status.as_deref() == Some("Wanted"))
            })
            .count();
        let total_children = items.iter().map(|item| item.children.len()).sum();

        let top_stage_pulses = stage_templates
            .iter()
            .map(|stage| ShoppingOverviewStagePulseDto {
                id: stage.id.clone(),
                name: stage.name.clone(),
                item_count: Self::count_to_i32(stage.items.len()),
            })
            .collect::<Vec<_>>();

        let top_system_pulses = system_definitions
            .iter()
            .map(|system| ShoppingOverviewDimensionPulseDto {
                id: system.id.clone(),
                name: if system.name.is_empty() {
                    system.id.clone()
                } else {
                    system.name.clone()
                },
                item_count: Self::count_to_i32(
                    items
                        .iter()
                        .filter(|item| item.system_tags.contains(&system.id))
                        .count(),
                ),
            })
            .collect::<Vec<_>>();

        let top_space_pulses = space_definitions
            .iter()
            .map(|space| ShoppingOverviewDimensionPulseDto {
                id: space.id.clone(),
                name: space.name.clone(),
                item_count: Self::count_to_i32(
                    items
                        .iter()
                        .filter(|item| item.space_tags.contains(&space.id))
                        .count(),
                ),
            })
            .collect::<Vec<_>>();

        let mut top_stage_pulses = top_stage_pulses;
        top_stage_pulses.sort_by(|a, b| {
            b.item_count
                .cmp(&a.item_count)
                .then_with(|| a.name.cmp(&b.name))
        });
        top_stage_pulses.truncate(4);

        let mut top_system_pulses = top_system_pulses;
        top_system_pulses.sort_by(|a, b| {
            b.item_count
                .cmp(&a.item_count)
                .then_with(|| a.name.cmp(&b.name))
        });
        top_system_pulses.truncate(5);

        let mut top_space_pulses = top_space_pulses;
        top_space_pulses.sort_by(|a, b| {
            b.item_count
                .cmp(&a.item_count)
                .then_with(|| a.name.cmp(&b.name))
        });
        top_space_pulses.truncate(5);

        ShoppingOverviewDto {
            total_items: Self::count_to_i32(items.len()),
            owned_items: Self::count_to_i32(owned_items),
            wanted_items: Self::count_to_i32(wanted_items),
            total_systems: Self::count_to_i32(system_definitions.len()),
            total_spaces: Self::count_to_i32(space_definitions.len()),
            total_stages: Self::count_to_i32(stage_templates.len()),
            total_children: Self::count_to_i32(total_children),
            total_spotlights: Self::count_to_i32(spotlights.len()),
            total_boundary_entries: Self::count_to_i32(boundary_entries.len()),
            total_lifestyle_collections: Self::count_to_i32(lifestyle_collections.len()),
            top_stage_pulses,
            top_system_pulses,
            top_space_pulses,
        }
    }

    // ===== System definitions =====

    pub fn list_system_definitions_dto(
        conn: &Connection,
    ) -> Result<Vec<ShoppingSystemDefinitionDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_system_definitions WHERE is_enabled = 1 ORDER BY sort_order, id")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], row_to_system_definition)
            .map_err(|e| e.to_string())?;

        let mut defs = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let secondary_groups: Vec<String> =
                serde_json::from_str(&r.secondary_groups_json).unwrap_or_default();
            defs.push(ShoppingSystemDefinitionDto {
                id: r.id,
                name: r.name,
                summary: r.summary,
                key_question: r.key_question,
                secondary_groups,
            });
        }
        Ok(defs)
    }

    pub fn create_system_definition(
        conn: &Connection,
        id: &str,
        name: &str,
        summary: &str,
        key_question: &str,
        secondary_groups: &[String],
        now: &str,
    ) -> Result<(), String> {
        let next_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_system_definitions",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        let groups_json = serde_json::to_string(secondary_groups).unwrap_or_default();
        conn.execute(
            "INSERT INTO shopping_system_definitions (id, name, summary, key_question, secondary_groups_json, sort_order, is_enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)",
            params![id, name, summary, key_question, groups_json, next_order, now, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_system_definition(
        conn: &Connection,
        id: &str,
        name: &str,
        summary: &str,
        key_question: &str,
        secondary_groups: &[String],
        now: &str,
    ) -> Result<(), String> {
        let groups_json = serde_json::to_string(secondary_groups).unwrap_or_default();
        conn.execute(
            "UPDATE shopping_system_definitions
             SET name = ?2, summary = ?3, key_question = ?4, secondary_groups_json = ?5, updated_at = ?6
             WHERE id = ?1",
            params![id, name, summary, key_question, groups_json, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_system_definition(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_item_systems WHERE system_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_stage_template_system_dimensions WHERE system_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE shopping_page_content SET system_id = NULL WHERE system_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_system_definitions WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn reorder_system_definitions(
        conn: &Connection,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        for (i, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_system_definitions SET sort_order = ?2, updated_at = ?3 WHERE id = ?1",
                params![id, i as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn replace_system_definition_items(
        conn: &Connection,
        system_id: &str,
        item_ids: &[String],
    ) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_item_systems WHERE system_id = ?1",
            params![system_id],
        )
        .map_err(|e| e.to_string())?;

        for (index, item_id) in item_ids.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_item_systems (id, item_id, system_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![
                    format!("{}_{}_sys_assign_{}", item_id, system_id, index),
                    item_id,
                    system_id,
                    index as i32,
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    // ===== Space definitions =====

    pub fn list_space_definitions_dto(
        conn: &Connection,
    ) -> Result<Vec<ShoppingSpaceDefinitionDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_space_definitions ORDER BY sort_order, id")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], row_to_space_definition)
            .map_err(|e| e.to_string())?;

        let mut defs = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            defs.push(ShoppingSpaceDefinitionDto {
                id: r.id,
                name: r.name,
                note: r.note,
            });
        }
        Ok(defs)
    }

    pub fn list_attribute_definitions_dto(
        conn: &Connection,
    ) -> Result<Vec<ShoppingAttributeDefinitionDto>, String> {
        Self::list_attribute_definitions_with_enabled_filter(conn, true)
    }

    pub fn list_all_attribute_definitions_dto(
        conn: &Connection,
    ) -> Result<Vec<ShoppingAttributeDefinitionDto>, String> {
        Self::list_attribute_definitions_with_enabled_filter(conn, false)
    }

    fn list_attribute_definitions_with_enabled_filter(
        conn: &Connection,
        enabled_only: bool,
    ) -> Result<Vec<ShoppingAttributeDefinitionDto>, String> {
        let sql = if enabled_only {
            "SELECT *
             FROM shopping_attribute_definitions
             WHERE is_enabled = 1
             ORDER BY kind, sort_order, id"
        } else {
            "SELECT *
             FROM shopping_attribute_definitions
             ORDER BY kind, sort_order, id"
        };
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], row_to_attribute_definition)
            .map_err(|e| e.to_string())?;

        let mut defs = Vec::new();
        for row in rows {
            defs.push(Self::row_to_attribute_definition_dto(
                row.map_err(|e| e.to_string())?,
            ));
        }
        Ok(defs)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_attribute_definition(
        conn: &Connection,
        id: &str,
        kind: &str,
        code: &str,
        semantic_key: Option<&str>,
        label: &str,
        label_en: Option<&str>,
        description: &str,
        style_token: Option<&str>,
        rank: Option<i32>,
        is_enabled: bool,
        is_system: bool,
        now: &str,
    ) -> Result<ShoppingAttributeDefinitionDto, String> {
        let normalized_kind = Self::normalize_attribute_kind(kind)?;
        Self::validate_attribute_semantic(&normalized_kind, semantic_key)?;
        let normalized_code = code.trim();
        if normalized_code.is_empty() {
            return Err("code is required".to_string());
        }
        let normalized_label = label.trim();
        if normalized_label.is_empty() {
            return Err("label is required".to_string());
        }

        let next_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1
                 FROM shopping_attribute_definitions
                 WHERE kind = ?1",
                params![&normalized_kind],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO shopping_attribute_definitions (
                id, kind, code, semantic_key, label, label_en, description, style_token,
                rank, sort_order, is_enabled, is_system, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                id,
                &normalized_kind,
                normalized_code,
                semantic_key
                    .map(str::trim)
                    .filter(|value| !value.is_empty()),
                normalized_label,
                label_en.map(str::trim).filter(|value| !value.is_empty()),
                description.trim(),
                style_token.map(str::trim).filter(|value| !value.is_empty()),
                rank,
                next_order,
                is_enabled,
                is_system,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

        Self::ensure_required_semantic_keys(conn, &normalized_kind)?;

        Ok(ShoppingAttributeDefinitionDto {
            id: id.to_string(),
            kind: normalized_kind,
            code: normalized_code.to_string(),
            semantic_key: semantic_key
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            label: normalized_label.to_string(),
            label_en: label_en
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            description: description.trim().to_string(),
            style_token: style_token
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            rank,
            sort_order: next_order,
            is_enabled,
            is_system,
        })
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_attribute_definition(
        conn: &Connection,
        id: &str,
        kind: &str,
        code: &str,
        semantic_key: Option<&str>,
        label: &str,
        label_en: Option<&str>,
        description: &str,
        style_token: Option<&str>,
        rank: Option<i32>,
        is_enabled: bool,
        is_system: bool,
        now: &str,
    ) -> Result<ShoppingAttributeDefinitionDto, String> {
        let normalized_kind = Self::normalize_attribute_kind(kind)?;
        Self::validate_attribute_semantic(&normalized_kind, semantic_key)?;
        let normalized_code = code.trim();
        if normalized_code.is_empty() {
            return Err("code is required".to_string());
        }
        let normalized_label = label.trim();
        if normalized_label.is_empty() {
            return Err("label is required".to_string());
        }

        let existing_row = conn
            .query_row(
                "SELECT * FROM shopping_attribute_definitions WHERE id = ?1",
                params![id],
                row_to_attribute_definition,
            )
            .map_err(|e| e.to_string())?;

        if existing_row.is_system
            && existing_row.kind == "status"
            && (existing_row.kind != normalized_kind
                || existing_row.code != normalized_code
                || existing_row.semantic_key.as_deref()
                    != semantic_key
                        .map(str::trim)
                        .filter(|value| !value.is_empty()))
        {
            return Err(format!(
                "system {kind} identity fields are immutable",
                kind = existing_row.kind
            ));
        }

        conn.execute(
            "UPDATE shopping_attribute_definitions
             SET kind = ?2, code = ?3, semantic_key = ?4, label = ?5, label_en = ?6,
                 description = ?7, style_token = ?8, rank = ?9, is_enabled = ?10,
                 is_system = ?11, updated_at = ?12
             WHERE id = ?1",
            params![
                id,
                &normalized_kind,
                normalized_code,
                semantic_key
                    .map(str::trim)
                    .filter(|value| !value.is_empty()),
                normalized_label,
                label_en.map(str::trim).filter(|value| !value.is_empty()),
                description.trim(),
                style_token.map(str::trim).filter(|value| !value.is_empty()),
                rank,
                is_enabled,
                is_system,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

        Self::ensure_required_semantic_keys(conn, &normalized_kind)?;

        let sort_order = conn
            .query_row(
                "SELECT sort_order FROM shopping_attribute_definitions WHERE id = ?1",
                params![id],
                |row| row.get::<_, i32>(0),
            )
            .map_err(|e| e.to_string())?;

        Ok(ShoppingAttributeDefinitionDto {
            id: id.to_string(),
            kind: normalized_kind,
            code: normalized_code.to_string(),
            semantic_key: semantic_key
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            label: normalized_label.to_string(),
            label_en: label_en
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            description: description.trim().to_string(),
            style_token: style_token
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToOwned::to_owned),
            rank,
            sort_order,
            is_enabled,
            is_system,
        })
    }

    pub fn disable_attribute_definition(
        conn: &Connection,
        id: &str,
        now: &str,
    ) -> Result<(), String> {
        let existing_row = conn
            .query_row(
                "SELECT * FROM shopping_attribute_definitions WHERE id = ?1",
                params![id],
                row_to_attribute_definition,
            )
            .map_err(|e| e.to_string())?;

        if existing_row.is_system
            && existing_row.kind == "status"
            && existing_row.semantic_key.is_some()
        {
            return Err(format!(
                "system {kind} with required semanticKey cannot be disabled",
                kind = existing_row.kind
            ));
        }

        conn.execute(
            "UPDATE shopping_attribute_definitions
             SET is_enabled = 0, updated_at = ?2
             WHERE id = ?1",
            params![id, now],
        )
        .map_err(|e| e.to_string())?;

        Self::ensure_required_semantic_keys(conn, &existing_row.kind)?;
        Ok(())
    }

    pub fn reorder_attribute_definitions(
        conn: &Connection,
        kind: &str,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        let normalized_kind = Self::normalize_attribute_kind(kind)?;
        for (index, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_attribute_definitions
                 SET sort_order = ?3, updated_at = ?4
                 WHERE id = ?1 AND kind = ?2",
                params![id, &normalized_kind, index as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn create_space_definition(
        conn: &Connection,
        id: &str,
        name: &str,
        note: &str,
        now: &str,
    ) -> Result<ShoppingSpaceDefinitionDto, String> {
        let next_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_space_definitions",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO shopping_space_definitions (id, name, note, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, name, note, next_order, now, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(ShoppingSpaceDefinitionDto {
            id: id.to_string(),
            name: name.to_string(),
            note: note.to_string(),
        })
    }

    pub fn update_space_definition(
        conn: &Connection,
        id: &str,
        name: &str,
        note: &str,
        now: &str,
    ) -> Result<ShoppingSpaceDefinitionDto, String> {
        conn.execute(
            "UPDATE shopping_space_definitions SET name = ?2, note = ?3, updated_at = ?4 WHERE id = ?1",
            params![id, name, note, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(ShoppingSpaceDefinitionDto {
            id: id.to_string(),
            name: name.to_string(),
            note: note.to_string(),
        })
    }

    pub fn delete_space_definition(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_item_spaces WHERE space_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_stage_template_space_dimensions WHERE space_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_space_definitions WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn reorder_space_definitions(
        conn: &Connection,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        for (i, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_space_definitions SET sort_order = ?2, updated_at = ?3 WHERE id = ?1",
                params![id, i as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn replace_space_definition_items(
        conn: &Connection,
        space_id: &str,
        item_ids: &[String],
    ) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_item_spaces WHERE space_id = ?1",
            params![space_id],
        )
        .map_err(|e| e.to_string())?;

        for (index, item_id) in item_ids.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_item_spaces (id, item_id, space_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![
                    format!("{}_{}_space_assign_{}", item_id, space_id, index),
                    item_id,
                    space_id,
                    index as i32,
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    // ===== Items =====

    pub fn list_items_dto(conn: &Connection) -> Result<Vec<ShoppingItemDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_items WHERE is_archived = 0 ORDER BY sort_order, id")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], row_to_item).map_err(|e| e.to_string())?;

        let mut items = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            items.push(Self::hydrate_item(conn, r)?);
        }
        Ok(items)
    }

    fn hydrate_item(conn: &Connection, r: ItemRow) -> Result<ShoppingItemDto, String> {
        let children = Self::list_children_for_item(conn, &r.id)?;
        let system_tags = Self::list_system_tags_for_item(conn, &r.id)?;
        let space_tags = Self::list_space_tags_for_item(conn, &r.id)?;

        Ok(ShoppingItemDto {
            id: r.id,
            name: r.name,
            children,
            system_tags,
            space_tags,
            note: r.note,
        })
    }

    fn list_children_for_item(
        conn: &Connection,
        item_id: &str,
    ) -> Result<Vec<ShoppingItemChildDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, status, lifecycle, depreciation
                 FROM shopping_item_children
                 WHERE item_id = ?1
                 ORDER BY sort_order, id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| {
                Ok(ShoppingItemChildDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    status: row.get(2)?,
                    lifecycle: row.get(3)?,
                    depreciation: row.get(4)?,
                    channel_prices: Vec::new(),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for row in rows {
            let mut child = row.map_err(|e| e.to_string())?;
            child.channel_prices = Self::list_channel_prices_for_child(conn, &child.id)?;
            list.push(child);
        }
        Ok(list)
    }

    fn list_channel_prices_for_child(
        conn: &Connection,
        child_id: &str,
    ) -> Result<Vec<ShoppingItemChildChannelDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, channel, entry_price, sweet_spot_price, overpay_price
                 FROM shopping_item_child_channels
                 WHERE item_child_id = ?1
                 ORDER BY sort_order, id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![child_id], |row| {
                Ok(ShoppingItemChildChannelDto {
                    id: row.get(0)?,
                    channel: row.get(1)?,
                    entry_price: row.get(2)?,
                    sweet_spot_price: row.get(3)?,
                    overpay_price: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    fn list_system_tags_for_item(conn: &Connection, item_id: &str) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT system_id FROM shopping_item_systems WHERE item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    fn list_space_tags_for_item(conn: &Connection, item_id: &str) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT space_id FROM shopping_item_spaces WHERE item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    #[allow(dead_code)]
    fn list_channels_for_item(conn: &Connection, item_id: &str) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT channel FROM shopping_item_channels WHERE item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        let mut list = Vec::new();
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    pub fn get_item_by_id(conn: &Connection, id: &str) -> Result<Option<ShoppingItemDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_items WHERE id = ?1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map(params![id], row_to_item)
            .map_err(|e| e.to_string())?;
        if let Some(row) = rows.next() {
            let r = row.map_err(|e| e.to_string())?;
            Ok(Some(Self::hydrate_item(conn, r)?))
        } else {
            Ok(None)
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn upsert_item(
        conn: &Connection,
        id: &str,
        name: &str,
        note: &str,
        children: &[ItemChildWriteModel],
        system_tags: &[String],
        space_tags: &[String],
        is_update: bool,
        now: &str,
    ) -> Result<(), String> {
        Self::ensure_required_semantic_keys(conn, "status")?;
        Self::validate_item_children_attributes(conn, children)?;

        if is_update {
            Self::delete_stage_tiers_for_item_children(conn, id)?;
            conn.execute(
                "UPDATE shopping_items SET
                    name = ?2, note = ?3, updated_at = ?4
                 WHERE id = ?1",
                params![id, name, note, now,],
            )
            .map_err(|e| e.to_string())?;

            // 删除旧的关联数据
            conn.execute(
                "DELETE FROM shopping_item_children WHERE item_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            conn.execute(
                "DELETE FROM shopping_item_systems WHERE item_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            conn.execute(
                "DELETE FROM shopping_item_spaces WHERE item_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            conn.execute(
                "DELETE FROM shopping_item_channels WHERE item_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
        } else {
            let next_order: i32 = conn
                .query_row(
                    "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_items",
                    [],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;
            conn.execute(
                "INSERT INTO shopping_items (
                    id, name, status, lifecycle, depreciation,
                    entry_price, sweet_spot_price, overpay_price,
                    note, quantity, replacement_cue,
                    reason, target_lifestyle, current_price, buy_below_price, keywords_json,
                    sort_order, is_archived, created_at, updated_at
                ) VALUES (?1, ?2, 'Owned', 'Durable', NULL, NULL, NULL, NULL, ?3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?4, 0, ?5, ?6)",
                params![
                    id, name, note, next_order, now, now,
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        // 子级
        for (i, child) in children.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_item_children (
                    id, item_id, name, status, lifecycle, depreciation, sort_order
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    &child.id,
                    id,
                    &child.name,
                    child.status.as_deref(),
                    child.lifecycle.as_deref(),
                    child.depreciation.as_deref(),
                    i as i32
                ],
            )
            .map_err(|e| e.to_string())?;

            for (channel_index, channel) in child.channel_prices.iter().enumerate() {
                conn.execute(
                    "INSERT INTO shopping_item_child_channels (
                        id, item_child_id, channel, entry_price, sweet_spot_price, overpay_price, sort_order
                     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        &channel.id,
                        &child.id,
                        &channel.channel,
                        channel.entry_price,
                        channel.sweet_spot_price,
                        channel.overpay_price,
                        channel_index as i32
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        // 系统标签
        for (i, sys) in system_tags.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_item_systems (id, item_id, system_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_sys_{}", id, i), id, sys, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        // 空间标签
        for (i, sp) in space_tags.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_item_spaces (id, item_id, space_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_spc_{}", id, i), id, sp, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    fn validate_item_children_attributes(
        conn: &Connection,
        children: &[ItemChildWriteModel],
    ) -> Result<(), String> {
        for child in children {
            Self::require_enabled_attribute_code(conn, "status", child.status.as_deref(), true)?;
            Self::require_enabled_attribute_code(
                conn,
                "lifecycle",
                child.lifecycle.as_deref(),
                true,
            )?;
            Self::require_enabled_attribute_code(
                conn,
                "depreciation",
                child.depreciation.as_deref(),
                false,
            )?;
        }
        Ok(())
    }

    pub fn delete_item(conn: &Connection, id: &str) -> Result<(), String> {
        Self::delete_stage_records_for_item(conn, id)?;
        conn.execute("DELETE FROM shopping_items WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ===== Stage templates =====

    pub fn list_stage_templates_dto(
        conn: &Connection,
    ) -> Result<Vec<ShoppingStageTemplateDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_stage_templates ORDER BY sort_order, id")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], row_to_stage_template)
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let system_dimension_ids = Self::list_stage_dimension_ids(
                conn,
                "shopping_stage_template_system_dimensions",
                "system_id",
                &r.id,
            )?;
            let space_dimension_ids = Self::list_stage_dimension_ids(
                conn,
                "shopping_stage_template_space_dimensions",
                "space_id",
                &r.id,
            )?;
            let items = Self::list_stage_items_for_template(conn, &r.id)?;
            list.push(ShoppingStageTemplateDto {
                id: r.id,
                name: r.name,
                description: r.description,
                focus: r.focus,
                system_dimension_ids,
                space_dimension_ids,
                items,
            });
        }
        Ok(list)
    }

    fn list_stage_items_for_template(
        conn: &Connection,
        stage_template_id: &str,
    ) -> Result<Vec<ShoppingStageItemDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT * FROM shopping_stage_items WHERE stage_template_id = ?1 ORDER BY sort_order, id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![stage_template_id], row_to_stage_item)
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let tiers = Self::list_tiers_for_stage_item(conn, &r.id)?;
            list.push(ShoppingStageItemDto {
                item_id: r.item_id,
                tiers,
            });
        }
        Ok(list)
    }

    fn list_stage_dimension_ids(
        conn: &Connection,
        table: &str,
        dimension_column: &str,
        stage_template_id: &str,
    ) -> Result<Vec<String>, String> {
        let sql = format!(
            "SELECT {dimension_column} FROM {table} WHERE stage_template_id = ?1 ORDER BY sort_order, id"
        );
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![stage_template_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        let mut values = Vec::new();
        for row in rows {
            values.push(row.map_err(|e| e.to_string())?);
        }
        Ok(values)
    }

    fn list_tiers_for_stage_item(
        conn: &Connection,
        stage_item_id: &str,
    ) -> Result<ShoppingStageItemTiersDto, String> {
        let mut stmt = conn
            .prepare(
                "SELECT tier, item_child_id FROM shopping_stage_item_tiers
                 WHERE stage_item_id = ?1 ORDER BY tier, sort_order",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![stage_item_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;

        let mut low = Vec::new();
        let mut base = Vec::new();
        let mut up = Vec::new();
        for row in rows {
            let (tier, child_id) = row.map_err(|e| e.to_string())?;
            match tier.as_str() {
                "low" => low.push(child_id),
                "base" => base.push(child_id),
                "up" => up.push(child_id),
                _ => {}
            }
        }
        Ok(ShoppingStageItemTiersDto { low, base, up })
    }

    pub fn upsert_stage_template(
        conn: &Connection,
        id: &str,
        name: &str,
        description: &str,
        focus: &str,
        system_dimension_ids: &[String],
        space_dimension_ids: &[String],
        items: &[(String, Vec<String>, Vec<String>, Vec<String>)], // (item_id, low, base, up)
        is_update: bool,
        now: &str,
    ) -> Result<(), String> {
        let _ = system_dimension_ids;
        let _ = space_dimension_ids;
        let normalized_items = Self::normalize_stage_items(conn, items)?;
        let normalized_item_ids = normalized_items
            .iter()
            .map(|(item_id, _, _, _)| item_id.clone())
            .collect::<Vec<_>>();
        let (normalized_system_dimension_ids, normalized_space_dimension_ids) =
            Self::derive_stage_dimension_ids(conn, &normalized_item_ids)?;

        if is_update {
            conn.execute(
                "UPDATE shopping_stage_templates SET name = ?2, description = ?3, focus = ?4, updated_at = ?5 WHERE id = ?1",
                params![id, name, description, focus, now],
            )
            .map_err(|e| e.to_string())?;

            // 删除旧的子表数据(级联会删 tiers)
            conn.execute(
                "DELETE FROM shopping_stage_items WHERE stage_template_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            conn.execute(
                "DELETE FROM shopping_stage_template_system_dimensions WHERE stage_template_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            conn.execute(
                "DELETE FROM shopping_stage_template_space_dimensions WHERE stage_template_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
        } else {
            let next_order: i32 = conn
                .query_row(
                    "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_stage_templates",
                    [],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;
            conn.execute(
                "INSERT INTO shopping_stage_templates (id, name, description, focus, sort_order, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![id, name, description, focus, next_order, now, now],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, system_id) in normalized_system_dimension_ids.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_stage_template_system_dimensions (id, stage_template_id, system_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_sys_{}", id, i), id, system_id, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, space_id) in normalized_space_dimension_ids.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_stage_template_space_dimensions (id, stage_template_id, space_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_spc_{}", id, i), id, space_id, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, (item_id, low, base, up)) in normalized_items.iter().enumerate() {
            let stage_item_id = format!("{}_si_{}", id, i);
            conn.execute(
                "INSERT INTO shopping_stage_items (id, stage_template_id, item_id, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![stage_item_id, id, item_id, i as i32],
            )
            .map_err(|e| e.to_string())?;

            for (j, child_id) in low.iter().enumerate() {
                conn.execute(
                    "INSERT INTO shopping_stage_item_tiers (id, stage_item_id, tier, item_child_id, sort_order)
                     VALUES (?1, ?2, 'low', ?3, ?4)",
                    params![format!("{}_low_{}", stage_item_id, j), stage_item_id, child_id, j as i32],
                )
                .map_err(|e| e.to_string())?;
            }
            for (j, child_id) in base.iter().enumerate() {
                conn.execute(
                    "INSERT INTO shopping_stage_item_tiers (id, stage_item_id, tier, item_child_id, sort_order)
                     VALUES (?1, ?2, 'base', ?3, ?4)",
                    params![format!("{}_base_{}", stage_item_id, j), stage_item_id, child_id, j as i32],
                )
                .map_err(|e| e.to_string())?;
            }
            for (j, child_id) in up.iter().enumerate() {
                conn.execute(
                    "INSERT INTO shopping_stage_item_tiers (id, stage_item_id, tier, item_child_id, sort_order)
                     VALUES (?1, ?2, 'up', ?3, ?4)",
                    params![format!("{}_up_{}", stage_item_id, j), stage_item_id, child_id, j as i32],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        Ok(())
    }

    pub fn delete_stage_template(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute(
            "UPDATE shopping_page_content SET stage = NULL WHERE stage = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_stage_templates WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn reorder_stage_templates(
        conn: &Connection,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        for (i, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_stage_templates SET sort_order = ?2, updated_at = ?3 WHERE id = ?1",
                params![id, i as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn get_stage_template_by_id(
        conn: &Connection,
        id: &str,
    ) -> Result<Option<ShoppingStageTemplateDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_stage_templates WHERE id = ?1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map(params![id], row_to_stage_template)
            .map_err(|e| e.to_string())?;
        if let Some(row) = rows.next() {
            let r = row.map_err(|e| e.to_string())?;
            let system_dimension_ids = Self::list_stage_dimension_ids(
                conn,
                "shopping_stage_template_system_dimensions",
                "system_id",
                &r.id,
            )?;
            let space_dimension_ids = Self::list_stage_dimension_ids(
                conn,
                "shopping_stage_template_space_dimensions",
                "space_id",
                &r.id,
            )?;
            let items = Self::list_stage_items_for_template(conn, &r.id)?;
            Ok(Some(ShoppingStageTemplateDto {
                id: r.id,
                name: r.name,
                description: r.description,
                focus: r.focus,
                system_dimension_ids,
                space_dimension_ids,
                items,
            }))
        } else {
            Ok(None)
        }
    }

    // ===== Page content(spotlight/boundary/lifestyle) =====

    pub fn list_page_contents(
        conn: &Connection,
        content_type: Option<&str>,
    ) -> Result<Vec<PageContentRow>, String> {
        let mut list = Vec::new();
        match content_type {
            Some(ct) => {
                let mut stmt = conn
                    .prepare(
                        "SELECT * FROM shopping_page_content
                         WHERE content_type = ?1 AND is_enabled = 1 ORDER BY sort_order, id",
                    )
                    .map_err(|e| e.to_string())?;
                let rows = stmt
                    .query_map(params![ct], row_to_page_content)
                    .map_err(|e| e.to_string())?;
                for row in rows {
                    list.push(row.map_err(|e| e.to_string())?);
                }
            }
            None => {
                let mut stmt = conn
                    .prepare(
                        "SELECT * FROM shopping_page_content
                         WHERE is_enabled = 1 ORDER BY sort_order, id",
                    )
                    .map_err(|e| e.to_string())?;
                let rows = stmt
                    .query_map([], row_to_page_content)
                    .map_err(|e| e.to_string())?;
                for row in rows {
                    list.push(row.map_err(|e| e.to_string())?);
                }
            }
        }
        Ok(list)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_page_content(
        conn: &Connection,
        id: &str,
        content_type: &str,
        title: Option<&str>,
        stage: Option<&str>,
        system_id: Option<&str>,
        summary: Option<&str>,
        reason: Option<&str>,
        body_json: &str,
        now: &str,
    ) -> Result<(), String> {
        let normalized_stage =
            Self::normalize_optional_reference(conn, "shopping_stage_templates", "id", stage)?;
        let normalized_system_id = Self::normalize_optional_reference(
            conn,
            "shopping_system_definitions",
            "id",
            system_id,
        )?;
        let next_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_page_content",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO shopping_page_content (id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10, ?11)",
            params![
                id,
                content_type,
                title,
                normalized_stage,
                normalized_system_id,
                summary,
                reason,
                body_json,
                next_order,
                now,
                now
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_page_content(
        conn: &Connection,
        id: &str,
        content_type: &str,
        title: Option<&str>,
        stage: Option<&str>,
        system_id: Option<&str>,
        summary: Option<&str>,
        reason: Option<&str>,
        body_json: &str,
        now: &str,
    ) -> Result<(), String> {
        let normalized_stage =
            Self::normalize_optional_reference(conn, "shopping_stage_templates", "id", stage)?;
        let normalized_system_id = Self::normalize_optional_reference(
            conn,
            "shopping_system_definitions",
            "id",
            system_id,
        )?;
        conn.execute(
            "UPDATE shopping_page_content SET
                content_type = ?2, title = ?3, stage = ?4, system_id = ?5,
                summary = ?6, reason = ?7, body_json = ?8, updated_at = ?9
             WHERE id = ?1",
            params![
                id,
                content_type,
                title,
                normalized_stage,
                normalized_system_id,
                summary,
                reason,
                body_json,
                now
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_page_content(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute(
            "DELETE FROM shopping_page_content WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_page_content_by_id(
        conn: &Connection,
        id: &str,
    ) -> Result<Option<PageContentRow>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM shopping_page_content WHERE id = ?1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map(params![id], row_to_page_content)
            .map_err(|e| e.to_string())?;
        if let Some(row) = rows.next() {
            Ok(Some(row.map_err(|e| e.to_string())?))
        } else {
            Ok(None)
        }
    }

    pub fn reorder_page_contents(
        conn: &Connection,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        for (i, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_page_content SET sort_order = ?2, updated_at = ?3 WHERE id = ?1",
                params![id, i as i32, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    // ===== 展示类内容聚合 =====

    fn list_spotlights(conn: &Connection) -> Result<Vec<ShoppingSpotlightDto>, String> {
        let rows = Self::list_page_contents(conn, Some("spotlight"))?;
        let mut list = Vec::new();
        for r in rows {
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();
            let attention: Vec<String> = body["attention"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            list.push(ShoppingSpotlightDto {
                id: r.id,
                title: r.title.unwrap_or_default(),
                stage: r.stage.unwrap_or_default(),
                summary: r.summary.unwrap_or_default(),
                reason: r.reason.unwrap_or_default(),
                attention,
            });
        }
        Ok(list)
    }

    fn list_boundary_entries(conn: &Connection) -> Result<Vec<ShoppingBoundaryEntryDto>, String> {
        let rows = Self::list_page_contents(conn, Some("boundary_entry"))?;
        let mut list = Vec::new();
        for r in rows {
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();
            list.push(ShoppingBoundaryEntryDto {
                id: r.id,
                item: body["item"].as_str().unwrap_or_default().to_string(),
                system: r.system_id.unwrap_or_default(),
                reason: body["reason"].as_str().unwrap_or_default().to_string(),
            });
        }
        Ok(list)
    }

    fn list_lifestyle_collections(
        conn: &Connection,
    ) -> Result<Vec<ShoppingLifestyleCollectionDto>, String> {
        let rows = Self::list_page_contents(conn, Some("lifestyle_collection"))?;
        let mut list = Vec::new();
        for r in rows {
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();
            let items: Vec<String> = body["items"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            list.push(ShoppingLifestyleCollectionDto {
                id: r.id,
                title: r.title.unwrap_or_default(),
                description: body["description"].as_str().unwrap_or_default().to_string(),
                items,
            });
        }
        Ok(list)
    }
}
