use std::collections::HashMap;

use crate::shopping::dto::{
    ShoppingBoundaryEntryDto, ShoppingItemBaseDto, ShoppingLifestyleCollectionDto,
    ShoppingModuleDto, ShoppingOwnedItemDto, ShoppingPlanItemDto, ShoppingPriceReferenceDto,
    ShoppingPurchaseLaneDto, ShoppingSpaceDefinitionDto, ShoppingSpotlightDto,
    ShoppingStageChecklistDto, ShoppingStageChecklistSectionDto, ShoppingSystemDefinitionDto,
};
use crate::shopping::models::{
    OwnedItemRow, OwnedItemSpaceRow, OwnedItemStageRow, PageContentRow, PlanItemRow,
    PlanItemSpaceRow, PlanItemStageRow, PlanItemTagRow, PurchaseLaneRow, SystemDefinitionRow,
};
use rusqlite::{params, Connection};

pub struct ShoppingRepository;

// ---- Helpers ----

fn row_to_system_definition(row: &rusqlite::Row) -> rusqlite::Result<SystemDefinitionRow> {
    Ok(SystemDefinitionRow {
        id: row.get("id")?,
        summary: row.get("summary")?,
        key_question: row.get("key_question")?,
        secondary_groups_json: row.get("secondary_groups_json")?,
        sort_order: row.get("sort_order")?,
        is_enabled: row.get("is_enabled")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_owned_item(row: &rusqlite::Row) -> rusqlite::Result<OwnedItemRow> {
    Ok(OwnedItemRow {
        id: row.get("id")?,
        name: row.get("name")?,
        system_id: row.get("system_id")?,
        category: row.get("category")?,
        necessity: row.get("necessity")?,
        lifecycle: row.get("lifecycle")?,
        depreciation: row.get("depreciation")?,
        quantity: row.get("quantity")?,
        status: row.get("status")?,
        replacement_cue: row.get("replacement_cue")?,
        note: row.get("note")?,
        sort_order: row.get("sort_order")?,
        is_archived: row.get("is_archived")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_owned_item_space(row: &rusqlite::Row) -> rusqlite::Result<OwnedItemSpaceRow> {
    Ok(OwnedItemSpaceRow {
        id: row.get("id")?,
        owned_item_id: row.get("owned_item_id")?,
        space_name: row.get("space_name")?,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_owned_item_stage(row: &rusqlite::Row) -> rusqlite::Result<OwnedItemStageRow> {
    Ok(OwnedItemStageRow {
        id: row.get("id")?,
        owned_item_id: row.get("owned_item_id")?,
        stage_name: row.get("stage_name")?,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_purchase_lane(row: &rusqlite::Row) -> rusqlite::Result<PurchaseLaneRow> {
    Ok(PurchaseLaneRow {
        id: row.get("id")?,
        title: row.get("title")?,
        subtitle: row.get("subtitle")?,
        sort_order: row.get("sort_order")?,
        is_enabled: row.get("is_enabled")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_plan_item(row: &rusqlite::Row) -> rusqlite::Result<PlanItemRow> {
    Ok(PlanItemRow {
        id: row.get("id")?,
        lane_id: row.get("lane_id")?,
        name: row.get("name")?,
        system_id: row.get("system_id")?,
        category: row.get("category")?,
        necessity: row.get("necessity")?,
        lifecycle: row.get("lifecycle")?,
        depreciation: row.get("depreciation")?,
        reason: row.get("reason")?,
        target_lifestyle: row.get("target_lifestyle")?,
        current_price: row.get("current_price")?,
        buy_below_price: row.get("buy_below_price")?,
        overpay_price: row.get("overpay_price")?,
        note: row.get("note")?,
        sort_order: row.get("sort_order")?,
        is_archived: row.get("is_archived")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_plan_item_space(row: &rusqlite::Row) -> rusqlite::Result<PlanItemSpaceRow> {
    Ok(PlanItemSpaceRow {
        id: row.get("id")?,
        plan_item_id: row.get("plan_item_id")?,
        space_name: row.get("space_name")?,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_plan_item_stage(row: &rusqlite::Row) -> rusqlite::Result<PlanItemStageRow> {
    Ok(PlanItemStageRow {
        id: row.get("id")?,
        plan_item_id: row.get("plan_item_id")?,
        stage_name: row.get("stage_name")?,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_plan_item_tag(row: &rusqlite::Row) -> rusqlite::Result<PlanItemTagRow> {
    Ok(PlanItemTagRow {
        id: row.get("id")?,
        plan_item_id: row.get("plan_item_id")?,
        tag_value: row.get("tag_value")?,
        tag_type: row.get("tag_type")?,
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

fn ensure_unique_space_definition_title(
    conn: &Connection,
    current_id: Option<&str>,
    title: Option<&str>,
) -> Result<(), String> {
    let Some(title) = title.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(());
    };

    let count: i64 = if let Some(id) = current_id {
        conn.query_row(
            "SELECT COUNT(*) FROM shopping_page_content
             WHERE content_type = 'space_definition' AND title = ?1 AND id != ?2 AND is_enabled = 1",
            params![title, id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?
    } else {
        conn.query_row(
            "SELECT COUNT(*) FROM shopping_page_content
             WHERE content_type = 'space_definition' AND title = ?1 AND is_enabled = 1",
            params![title],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?
    };

    if count > 0 {
        return Err("Space definition title already exists".to_string());
    }

    Ok(())
}

impl ShoppingRepository {
    // =====================
    // Legacy: get_shopping_module (kept for backward compatibility)
    // =====================

    #[allow(dead_code)]
    pub fn get_shopping_module(conn: &Connection) -> Result<ShoppingModuleDto, String> {
        let result: Result<String, rusqlite::Error> = conn.query_row(
            "SELECT content_json FROM shopping_module_content WHERE module_key = 'shopping' ORDER BY version DESC LIMIT 1",
            [],
            |row| row.get(0),
        );

        match result {
            Ok(json_str) => serde_json::from_str::<ShoppingModuleDto>(&json_str)
                .map_err(|e| format!("Failed to deserialize shopping module content: {}", e)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(ShoppingModuleDto::default()),
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }

    // =====================
    // Aggregation: build full ShoppingModuleDto from tables
    // =====================

    pub fn get_shopping_module_aggregated(conn: &Connection) -> Result<ShoppingModuleDto, String> {
        Ok(ShoppingModuleDto {
            system_definitions: Self::get_all_system_definitions(conn)?,
            space_definitions: Self::get_all_space_definitions(conn)?,
            spotlights: Self::get_all_spotlights(conn)?,
            owned_items: Self::get_all_owned_items_aggregated(conn)?,
            purchase_lanes: Self::get_all_purchase_lanes_aggregated(conn)?,
            stage_checklists: Self::get_all_stage_checklists(conn)?,
            price_references: Self::get_all_price_references(conn)?,
            boundary_entries: Self::get_all_boundary_entries(conn)?,
            lifestyle_collections: Self::get_all_lifestyle_collections(conn)?,
        })
    }

    // ---- System Definitions ----

    pub fn get_all_system_definitions(
        conn: &Connection,
    ) -> Result<Vec<ShoppingSystemDefinitionDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, summary, key_question, secondary_groups_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_system_definitions WHERE is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_system_definition)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let secondary_groups: Vec<String> =
                serde_json::from_str(&r.secondary_groups_json).unwrap_or_default();
            result.push(ShoppingSystemDefinitionDto {
                id: r.id,
                summary: r.summary,
                key_question: r.key_question,
                secondary_groups,
            });
        }
        Ok(result)
    }

    pub fn get_all_space_definitions(
        conn: &Connection,
    ) -> Result<Vec<ShoppingSpaceDefinitionDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'space_definition' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            if let Some(name) = r.title.filter(|title| !title.trim().is_empty()) {
                result.push(ShoppingSpaceDefinitionDto { id: r.id, name });
            }
        }
        Ok(result)
    }

    // ---- Owned Items ----

    pub fn get_spaces_for_owned_item(
        conn: &Connection,
        owned_item_id: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, owned_item_id, space_name, sort_order
                 FROM shopping_owned_item_spaces WHERE owned_item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![owned_item_id], row_to_owned_item_space)
            .map_err(|e| e.to_string())?;

        Ok(rows.filter_map(|r| r.ok()).map(|r| r.space_name).collect())
    }

    pub fn get_stages_for_owned_item(
        conn: &Connection,
        owned_item_id: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, owned_item_id, stage_name, sort_order
                 FROM shopping_owned_item_stages WHERE owned_item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![owned_item_id], row_to_owned_item_stage)
            .map_err(|e| e.to_string())?;

        Ok(rows.filter_map(|r| r.ok()).map(|r| r.stage_name).collect())
    }

    /// Batch-load all owned items with their spaces and stages in 3 queries instead of 2N+1.
    pub fn get_all_owned_items_aggregated(
        conn: &Connection,
    ) -> Result<Vec<ShoppingOwnedItemDto>, String> {
        // 1. Load all owned items
        let mut stmt = conn
            .prepare(
                "SELECT id, name, system_id, category, necessity, lifecycle, depreciation, quantity, status, replacement_cue, note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_owned_items WHERE is_archived = 0 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let owned_items: Vec<OwnedItemRow> = stmt
            .query_map([], row_to_owned_item)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        // 2. Batch-load all spaces for all non-archived owned items at once
        let mut spaces_stmt = conn
            .prepare(
                "SELECT s.owned_item_id, s.space_name
                 FROM shopping_owned_item_spaces s
                 INNER JOIN shopping_owned_items i ON s.owned_item_id = i.id
                 WHERE i.is_archived = 0
                 ORDER BY s.owned_item_id, s.sort_order",
            )
            .map_err(|e| e.to_string())?;

        let mut spaces_map: HashMap<String, Vec<String>> = HashMap::new();
        {
            let rows = spaces_stmt
                .query_map([], |row| {
                    Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                })
                .map_err(|e| e.to_string())?;
            for row in rows {
                let (item_id, space_name) = row.map_err(|e| e.to_string())?;
                spaces_map.entry(item_id).or_default().push(space_name);
            }
        }

        // 3. Batch-load all stages for all non-archived owned items at once
        let mut stages_stmt = conn
            .prepare(
                "SELECT s.owned_item_id, s.stage_name
                 FROM shopping_owned_item_stages s
                 INNER JOIN shopping_owned_items i ON s.owned_item_id = i.id
                 WHERE i.is_archived = 0
                 ORDER BY s.owned_item_id, s.sort_order",
            )
            .map_err(|e| e.to_string())?;

        let mut stages_map: HashMap<String, Vec<String>> = HashMap::new();
        {
            let rows = stages_stmt
                .query_map([], |row| {
                    Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                })
                .map_err(|e| e.to_string())?;
            for row in rows {
                let (item_id, stage_name) = row.map_err(|e| e.to_string())?;
                stages_map.entry(item_id).or_default().push(stage_name);
            }
        }

        // 4. Build DTOs from loaded data
        let result: Vec<ShoppingOwnedItemDto> = owned_items
            .into_iter()
            .map(|r| {
                let spaces = spaces_map.remove(&r.id).unwrap_or_default();
                let stages = stages_map.remove(&r.id).unwrap_or_default();
                ShoppingOwnedItemDto {
                    base: ShoppingItemBaseDto {
                        system: r.system_id,
                        category: r.category,
                        spaces,
                        stages,
                        // 注:DB 列 necessity 仍存在,但 DTO 不再暴露给前端
                        lifecycle: r.lifecycle,
                        depreciation: r.depreciation,
                    },
                    id: r.id,
                    name: r.name,
                    quantity: r.quantity,
                    status: r.status,
                    replacement_cue: r.replacement_cue,
                    note: r.note,
                }
            })
            .collect();

        Ok(result)
    }

    // ---- Purchase Lanes ----

    /// Batch-load all purchase lanes with their plan items in 5 queries instead of N*M*5+1.
    pub fn get_all_purchase_lanes_aggregated(
        conn: &Connection,
    ) -> Result<Vec<ShoppingPurchaseLaneDto>, String> {
        // 1. Load all enabled lanes
        let mut stmt = conn
            .prepare(
                "SELECT id, title, subtitle, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_purchase_lanes WHERE is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let lanes: Vec<PurchaseLaneRow> = stmt
            .query_map([], row_to_purchase_lane)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        // 2. Batch-load all non-archived plan items
        let mut plan_stmt = conn
            .prepare(
                "SELECT id, lane_id, name, system_id, category, necessity, lifecycle, depreciation,
                        reason, target_lifestyle, current_price, buy_below_price, overpay_price,
                        note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_plan_items WHERE is_archived = 0 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let plan_items: Vec<PlanItemRow> = plan_stmt
            .query_map([], row_to_plan_item)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let plan_item_ids: Vec<&str> = plan_items.iter().map(|p| p.id.as_str()).collect();
        if plan_item_ids.is_empty() {
            return Ok(lanes
                .into_iter()
                .map(|lane| ShoppingPurchaseLaneDto {
                    id: lane.id,
                    title: lane.title,
                    subtitle: lane.subtitle,
                    items: vec![],
                })
                .collect());
        }

        // 3. Batch-load all spaces, stages, keywords for all plan items
        // 注:tags 表内的 'tag' 类型数据保留但不再读取(物品的标签由 system/spaces/stages 在显示层渲染)
        let spaces_map = Self::batch_load_plan_item_spaces(conn)?;
        let stages_map = Self::batch_load_plan_item_stages(conn)?;
        let keywords_map = Self::batch_load_plan_item_tags_by_type(conn, "keyword")?;

        // 4. Build plan item DTOs and group by lane_id
        let mut plan_by_lane: HashMap<String, Vec<ShoppingPlanItemDto>> = HashMap::new();
        for r in plan_items {
            let spaces = spaces_map.get(&r.id).cloned().unwrap_or_default();
            let stages = stages_map.get(&r.id).cloned().unwrap_or_default();
            let keywords = keywords_map.get(&r.id).cloned().unwrap_or_default();
            let dto = ShoppingPlanItemDto {
                base: ShoppingItemBaseDto {
                    system: r.system_id,
                    category: r.category,
                    spaces,
                    stages,
                    // 注:DB 列 necessity 仍存在,但 DTO 不再暴露给前端
                    lifecycle: r.lifecycle,
                    depreciation: r.depreciation,
                },
                id: r.id,
                name: r.name,
                reason: r.reason,
                target_lifestyle: r.target_lifestyle,
                current_price: r.current_price,
                buy_below_price: r.buy_below_price,
                overpay_price: r.overpay_price,
                note: r.note,
                keywords,
            };
            plan_by_lane.entry(r.lane_id).or_default().push(dto);
        }

        let result: Vec<ShoppingPurchaseLaneDto> = lanes
            .into_iter()
            .map(|lane| {
                let items = plan_by_lane.remove(&lane.id).unwrap_or_default();
                ShoppingPurchaseLaneDto {
                    id: lane.id,
                    title: lane.title,
                    subtitle: lane.subtitle,
                    items,
                }
            })
            .collect();

        Ok(result)
    }

    fn batch_load_plan_item_spaces(
        conn: &Connection,
    ) -> Result<HashMap<String, Vec<String>>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT plan_item_id, space_name FROM shopping_plan_item_spaces ORDER BY plan_item_id, sort_order",
            )
            .map_err(|e| e.to_string())?;
        let mut map: HashMap<String, Vec<String>> = HashMap::new();
        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (item_id, val) = row.map_err(|e| e.to_string())?;
            map.entry(item_id).or_default().push(val);
        }
        Ok(map)
    }

    fn batch_load_plan_item_stages(
        conn: &Connection,
    ) -> Result<HashMap<String, Vec<String>>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT plan_item_id, stage_name FROM shopping_plan_item_stages ORDER BY plan_item_id, sort_order",
            )
            .map_err(|e| e.to_string())?;
        let mut map: HashMap<String, Vec<String>> = HashMap::new();
        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (item_id, val) = row.map_err(|e| e.to_string())?;
            map.entry(item_id).or_default().push(val);
        }
        Ok(map)
    }

    fn batch_load_plan_item_tags_by_type(
        conn: &Connection,
        tag_type: &str,
    ) -> Result<HashMap<String, Vec<String>>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT plan_item_id, tag_value FROM shopping_plan_item_tags WHERE tag_type = ?1 ORDER BY plan_item_id, sort_order",
            )
            .map_err(|e| e.to_string())?;
        let mut map: HashMap<String, Vec<String>> = HashMap::new();
        let rows = stmt
            .query_map(params![tag_type], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (item_id, val) = row.map_err(|e| e.to_string())?;
            map.entry(item_id).or_default().push(val);
        }
        Ok(map)
    }

    pub fn get_spaces_for_plan_item(
        conn: &Connection,
        plan_item_id: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, plan_item_id, space_name, sort_order
                 FROM shopping_plan_item_spaces WHERE plan_item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![plan_item_id], row_to_plan_item_space)
            .map_err(|e| e.to_string())?;

        Ok(rows.filter_map(|r| r.ok()).map(|r| r.space_name).collect())
    }

    pub fn get_stages_for_plan_item(
        conn: &Connection,
        plan_item_id: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, plan_item_id, stage_name, sort_order
                 FROM shopping_plan_item_stages WHERE plan_item_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![plan_item_id], row_to_plan_item_stage)
            .map_err(|e| e.to_string())?;

        Ok(rows.filter_map(|r| r.ok()).map(|r| r.stage_name).collect())
    }

    pub fn get_tags_for_plan_item(
        conn: &Connection,
        plan_item_id: &str,
        tag_type: &str,
    ) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, plan_item_id, tag_value, tag_type, sort_order
                 FROM shopping_plan_item_tags WHERE plan_item_id = ?1 AND tag_type = ?2 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![plan_item_id, tag_type], row_to_plan_item_tag)
            .map_err(|e| e.to_string())?;

        Ok(rows.filter_map(|r| r.ok()).map(|r| r.tag_value).collect())
    }

    // ---- Page Content: Spotlights ----

    pub fn get_all_spotlights(conn: &Connection) -> Result<Vec<ShoppingSpotlightDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'spotlight' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();
            let attention: Vec<String> = body["attention"]
                .as_array()
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            result.push(ShoppingSpotlightDto {
                id: r.id,
                title: r.title.unwrap_or_default(),
                stage: r.stage.unwrap_or_default(),
                summary: r.summary.unwrap_or_default(),
                reason: r.reason.unwrap_or_default(),
                attention,
            });
        }
        Ok(result)
    }

    // ---- Page Content: Stage Checklists ----

    pub fn get_all_stage_checklists(
        conn: &Connection,
    ) -> Result<Vec<ShoppingStageChecklistDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'stage_checklist' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();

            let sections: Vec<ShoppingStageChecklistSectionDto> = body["sections"]
                .as_array()
                .map(|a| {
                    a.iter()
                        .map(|s| ShoppingStageChecklistSectionDto {
                            system: s["system"].as_str().unwrap_or_default().to_string(),
                            // 注:新 shape — 各档位存物品 ID 数组
                            minimum_item_ids: s["minimumItemIds"]
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default(),
                            essential_item_ids: s["essentialItemIds"]
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default(),
                            upgrade_item_ids: s["upgradeItemIds"]
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default(),
                        })
                        .collect()
                })
                .unwrap_or_default();

            result.push(ShoppingStageChecklistDto {
                id: r.id,
                stage: r.stage.unwrap_or_default(),
                title: r.title.unwrap_or_default(),
                description: body["description"].as_str().unwrap_or_default().to_string(),
                focus: body["focus"].as_str().unwrap_or_default().to_string(),
                sections,
            });
        }
        Ok(result)
    }

    // ---- Page Content: Price References ----

    pub fn get_all_price_references(
        conn: &Connection,
    ) -> Result<Vec<ShoppingPriceReferenceDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'price_reference' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();

            result.push(ShoppingPriceReferenceDto {
                id: r.id,
                system: r.system_id.unwrap_or_default(),
                category: body["category"].as_str().unwrap_or_default().to_string(),
                lifecycle: body["lifecycle"].as_str().unwrap_or_default().to_string(),
                depreciation: body["depreciation"].as_str().map(String::from),
                entry_price: body["entryPrice"].as_f64().unwrap_or(0.0),
                sweet_spot_price: body["sweetSpotPrice"].as_f64().unwrap_or(0.0),
                overpay_price: body["overpayPrice"].as_f64().unwrap_or(0.0),
                note: body["note"].as_str().unwrap_or_default().to_string(),
            });
        }
        Ok(result)
    }

    // ---- Page Content: Boundary Entries ----

    pub fn get_all_boundary_entries(
        conn: &Connection,
    ) -> Result<Vec<ShoppingBoundaryEntryDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'boundary_entry' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();

            result.push(ShoppingBoundaryEntryDto {
                id: r.id,
                item: body["item"].as_str().unwrap_or_default().to_string(),
                system: r.system_id.unwrap_or_default(),
                reason: body["reason"].as_str().unwrap_or_default().to_string(),
            });
        }
        Ok(result)
    }

    // ---- Page Content: Lifestyle Collections ----

    pub fn get_all_lifestyle_collections(
        conn: &Connection,
    ) -> Result<Vec<ShoppingLifestyleCollectionDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE content_type = 'lifestyle_collection' AND is_enabled = 1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_page_content)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            let r = row.map_err(|e| e.to_string())?;
            let body: serde_json::Value = serde_json::from_str(&r.body_json).unwrap_or_default();

            let items: Vec<String> = body["items"]
                .as_array()
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            result.push(ShoppingLifestyleCollectionDto {
                id: r.id,
                title: r.title.unwrap_or_default(),
                description: body["description"].as_str().unwrap_or_default().to_string(),
                items,
            });
        }
        Ok(result)
    }

    // =====================
    // CRUD: Owned Items
    // =====================

    pub fn list_owned_items(conn: &Connection) -> Result<Vec<OwnedItemRow>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, system_id, category, necessity, lifecycle, depreciation, quantity, status, replacement_cue, note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_owned_items WHERE is_archived = 0 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_owned_item)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_owned_item(
        conn: &Connection,
        id: &str,
        name: &str,
        system_id: &str,
        category: &str,
        // 注:necessity 参数已删除 — DB 列仍存在,这里硬写空串占位
        lifecycle: &str,
        depreciation: Option<&str>,
        quantity: i32,
        status: &str,
        replacement_cue: &str,
        note: &str,
        spaces: &[String],
        stages: &[String],
        now: &str,
    ) -> Result<(), String> {
        conn.execute(
            "INSERT INTO shopping_owned_items (id, name, system_id, category, necessity, lifecycle, depreciation, quantity, status, replacement_cue, note, sort_order, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, 0, ?12, ?13)",
            params![
                id,
                name,
                system_id,
                category,
                "",
                lifecycle,
                depreciation,
                quantity,
                status,
                replacement_cue,
                note,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

        for (i, space) in spaces.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_owned_item_spaces (id, owned_item_id, space_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_space_{}", id, i), id, space, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, stage) in stages.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_owned_item_stages (id, owned_item_id, stage_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_stage_{}", id, i), id, stage, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_owned_item(
        conn: &Connection,
        id: &str,
        name: &str,
        system_id: &str,
        category: &str,
        // 注:necessity 参数已删除
        lifecycle: &str,
        depreciation: Option<&str>,
        quantity: i32,
        status: &str,
        replacement_cue: &str,
        note: &str,
        spaces: &[String],
        stages: &[String],
        now: &str,
    ) -> Result<(), String> {
        conn.execute(
            "UPDATE shopping_owned_items SET name=?1, system_id=?2, category=?3, lifecycle=?4, depreciation=?5, quantity=?6, status=?7, replacement_cue=?8, note=?9, updated_at=?10
             WHERE id=?11",
            params![
                name,
                system_id,
                category,
                lifecycle,
                depreciation,
                quantity,
                status,
                replacement_cue,
                note,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;

        // Delete old associations and rebuild
        conn.execute(
            "DELETE FROM shopping_owned_item_spaces WHERE owned_item_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_owned_item_stages WHERE owned_item_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;

        for (i, space) in spaces.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_owned_item_spaces (id, owned_item_id, space_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_space_{}", id, i), id, space, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, stage) in stages.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_owned_item_stages (id, owned_item_id, stage_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_stage_{}", id, i), id, stage, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_owned_item(conn: &Connection, id: &str) -> Result<(), String> {
        // CASCADE will handle spaces and stages
        conn.execute(
            "DELETE FROM shopping_owned_items WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_owned_item_by_id(
        conn: &Connection,
        id: &str,
    ) -> Result<Option<OwnedItemRow>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, system_id, category, necessity, lifecycle, depreciation, quantity, status, replacement_cue, note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_owned_items WHERE id = ?1",
            )
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map(params![id], row_to_owned_item)
            .map_err(|e| e.to_string())?;

        match rows.next() {
            Some(row) => Ok(Some(row.map_err(|e| e.to_string())?)),
            None => Ok(None),
        }
    }

    // =====================
    // CRUD: Plan Items
    // =====================

    pub fn list_plan_items(conn: &Connection) -> Result<Vec<PlanItemRow>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, lane_id, name, system_id, category, necessity, lifecycle, depreciation, reason, target_lifestyle, current_price, buy_below_price, overpay_price, note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_plan_items WHERE is_archived = 0 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], row_to_plan_item)
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_plan_item(
        conn: &Connection,
        id: &str,
        lane_id: &str,
        name: &str,
        system_id: &str,
        category: &str,
        // 注:necessity 与 tags 参数已删除
        lifecycle: &str,
        depreciation: Option<&str>,
        reason: &str,
        target_lifestyle: &str,
        current_price: f64,
        buy_below_price: f64,
        overpay_price: f64,
        note: &str,
        spaces: &[String],
        stages: &[String],
        keywords: &[String],
        now: &str,
    ) -> Result<(), String> {
        conn.execute(
            "INSERT INTO shopping_plan_items (id, lane_id, name, system_id, category, necessity, lifecycle, depreciation, reason, target_lifestyle, current_price, buy_below_price, overpay_price, note, sort_order, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 0, 0, ?15, ?16)",
            params![
                id,
                lane_id,
                name,
                system_id,
                category,
                "",
                lifecycle,
                depreciation,
                reason,
                target_lifestyle,
                current_price,
                buy_below_price,
                overpay_price,
                note,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

        for (i, space) in spaces.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_spaces (id, plan_item_id, space_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_space_{}", id, i), id, space, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, stage) in stages.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_stages (id, plan_item_id, stage_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_stage_{}", id, i), id, stage, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        // 注:tags 不再写入 — 物品的标签由 system/spaces/stages 在显示层渲染

        for (i, kw) in keywords.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_tags (id, plan_item_id, tag_value, tag_type, sort_order)
                 VALUES (?1, ?2, ?3, 'keyword', ?4)",
                params![format!("{}_kw_{}", id, i), id, kw, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_plan_item(
        conn: &Connection,
        id: &str,
        lane_id: &str,
        name: &str,
        system_id: &str,
        category: &str,
        // 注:necessity 与 tags 参数已删除
        lifecycle: &str,
        depreciation: Option<&str>,
        reason: &str,
        target_lifestyle: &str,
        current_price: f64,
        buy_below_price: f64,
        overpay_price: f64,
        note: &str,
        spaces: &[String],
        stages: &[String],
        keywords: &[String],
        now: &str,
    ) -> Result<(), String> {
        conn.execute(
            "UPDATE shopping_plan_items SET lane_id=?1, name=?2, system_id=?3, category=?4, lifecycle=?5, depreciation=?6, reason=?7, target_lifestyle=?8, current_price=?9, buy_below_price=?10, overpay_price=?11, note=?12, updated_at=?13
             WHERE id=?14",
            params![
                lane_id,
                name,
                system_id,
                category,
                lifecycle,
                depreciation,
                reason,
                target_lifestyle,
                current_price,
                buy_below_price,
                overpay_price,
                note,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;

        // Delete old associations and rebuild
        conn.execute(
            "DELETE FROM shopping_plan_item_spaces WHERE plan_item_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM shopping_plan_item_stages WHERE plan_item_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        // 注:仅清理 'keyword' 类型;'tag' 类型已停止维护,旧数据保留但不再读取
        conn.execute(
            "DELETE FROM shopping_plan_item_tags WHERE plan_item_id = ?1 AND tag_type = 'keyword'",
            params![id],
        )
        .map_err(|e| e.to_string())?;

        for (i, space) in spaces.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_spaces (id, plan_item_id, space_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_space_{}", id, i), id, space, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, stage) in stages.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_stages (id, plan_item_id, stage_name, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_stage_{}", id, i), id, stage, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        for (i, kw) in keywords.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_plan_item_tags (id, plan_item_id, tag_value, tag_type, sort_order)
                 VALUES (?1, ?2, ?3, 'keyword', ?4)",
                params![format!("{}_kw_{}", id, i), id, kw, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_plan_item(conn: &Connection, id: &str) -> Result<(), String> {
        conn.execute("DELETE FROM shopping_plan_items WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_plan_item_by_id(conn: &Connection, id: &str) -> Result<Option<PlanItemRow>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, lane_id, name, system_id, category, necessity, lifecycle, depreciation, reason, target_lifestyle, current_price, buy_below_price, overpay_price, note, sort_order, is_archived, created_at, updated_at
                 FROM shopping_plan_items WHERE id = ?1",
            )
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map(params![id], row_to_plan_item)
            .map_err(|e| e.to_string())?;

        match rows.next() {
            Some(row) => Ok(Some(row.map_err(|e| e.to_string())?)),
            None => Ok(None),
        }
    }

    // =====================
    // CRUD: Page Content
    // =====================

    pub fn list_page_contents(
        conn: &Connection,
        content_type: Option<&str>,
    ) -> Result<Vec<PageContentRow>, String> {
        let sql = if content_type.is_some() {
            "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
             FROM shopping_page_content WHERE content_type = ?1 AND is_enabled = 1 ORDER BY sort_order"
        } else {
            "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
             FROM shopping_page_content WHERE is_enabled = 1 ORDER BY sort_order"
        };

        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

        let rows = if let Some(ct) = content_type {
            stmt.query_map(params![ct], row_to_page_content)
                .map_err(|e| e.to_string())?
        } else {
            stmt.query_map([], row_to_page_content)
                .map_err(|e| e.to_string())?
        };

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
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
        if content_type == "space_definition" {
            ensure_unique_space_definition_title(conn, None, title)?;
        }

        let sort_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_page_content WHERE content_type = ?1",
                params![content_type],
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
                stage,
                system_id,
                summary,
                reason,
                body_json,
                sort_order,
                now,
                now,
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
        if content_type == "space_definition" {
            ensure_unique_space_definition_title(conn, Some(id), title)?;
        }

        conn.execute(
            "UPDATE shopping_page_content SET content_type=?1, title=?2, stage=?3, system_id=?4, summary=?5, reason=?6, body_json=?7, updated_at=?8
             WHERE id=?9",
            params![
                content_type,
                title,
                stage,
                system_id,
                summary,
                reason,
                body_json,
                now,
                id,
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

    // ---- Reordering ----

    pub fn update_system_definition(
        conn: &Connection,
        id: &str,
        summary: &str,
        key_question: &str,
        secondary_groups: &[String],
        now: &str,
    ) -> Result<(), String> {
        conn.execute(
            "UPDATE shopping_system_definitions
             SET summary = ?1, key_question = ?2, secondary_groups_json = ?3, updated_at = ?4
             WHERE id = ?5",
            params![
                summary,
                key_question,
                serde_json::to_string(secondary_groups).map_err(|e| e.to_string())?,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn create_system_definition(
        conn: &Connection,
        id: &str,
        summary: &str,
        key_question: &str,
        secondary_groups: &[String],
        now: &str,
    ) -> Result<(), String> {
        let sort_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM shopping_system_definitions",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO shopping_system_definitions
             (id, summary, key_question, secondary_groups_json, sort_order, is_enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?7)",
            params![
                id,
                summary,
                key_question,
                serde_json::to_string(secondary_groups).map_err(|e| e.to_string())?,
                sort_order,
                now,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_system_definition(conn: &Connection, id: &str) -> Result<(), String> {
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
        for (index, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_system_definitions SET sort_order = ?1, updated_at = ?2 WHERE id = ?3",
                params![index as i32, now, id],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn reorder_page_contents(
        conn: &Connection,
        ordered_ids: &[String],
        now: &str,
    ) -> Result<(), String> {
        for (index, id) in ordered_ids.iter().enumerate() {
            conn.execute(
                "UPDATE shopping_page_content SET sort_order = ?1, updated_at = ?2 WHERE id = ?3",
                params![index as i32, now, id],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn get_page_content_by_id(
        conn: &Connection,
        id: &str,
    ) -> Result<Option<PageContentRow>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, content_type, title, stage, system_id, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at
                 FROM shopping_page_content WHERE id = ?1",
            )
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map(params![id], row_to_page_content)
            .map_err(|e| e.to_string())?;

        match rows.next() {
            Some(row) => Ok(Some(row.map_err(|e| e.to_string())?)),
            None => Ok(None),
        }
    }
}
