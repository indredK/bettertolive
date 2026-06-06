use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

/// 创建或打开 SQLite 数据库,确保 schema 就位。
/// 注:本次重构采用激进策略 — 旧表全部 DROP,重建新表。开发期间数据丢失可接受。
pub fn initialize_database(db_path: &Path) -> SqliteResult<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    // 删除旧 schema(owned/plan 分裂、purchase_lanes、price_references 都已不再使用)
    drop_legacy_tables(&conn)?;

    create_new_schema(&conn)?;

    // 每个表独立判断是否需要 seed,避免某个表已有数据但其他表为空时跳过 seed
    seed_new_tables(&conn)?;

    Ok(conn)
}

fn table_is_empty(conn: &Connection, table: &str) -> SqliteResult<bool> {
    let count: i64 = conn.query_row(&format!("SELECT COUNT(*) FROM {}", table), [], |row| {
        row.get(0)
    })?;
    Ok(count == 0)
}

fn drop_legacy_tables(conn: &Connection) -> SqliteResult<()> {
    conn.execute_batch(
        "PRAGMA foreign_keys=OFF;
         DROP TABLE IF EXISTS shopping_owned_item_spaces;
         DROP TABLE IF EXISTS shopping_owned_item_stages;
         DROP TABLE IF EXISTS shopping_owned_items;
         DROP TABLE IF EXISTS shopping_plan_item_spaces;
         DROP TABLE IF EXISTS shopping_plan_item_stages;
         DROP TABLE IF EXISTS shopping_plan_item_tags;
         DROP TABLE IF EXISTS shopping_plan_items;
         DROP TABLE IF EXISTS shopping_purchase_lanes;
         DROP TABLE IF EXISTS shopping_module_content;
         PRAGMA foreign_keys=ON;",
    )?;
    Ok(())
}

fn create_new_schema(conn: &Connection) -> SqliteResult<()> {
    // 系统定义(增加 name 字段)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_system_definitions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            summary TEXT NOT NULL,
            key_question TEXT NOT NULL,
            secondary_groups_json TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 兼容:如果旧表存在但没 name 列,补一列
    add_column_if_missing(
        conn,
        "shopping_system_definitions",
        "name",
        "TEXT NOT NULL DEFAULT ''",
    )?;

    // 空间定义(独立表)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_space_definitions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            note TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 兼容：旧表可能缺少 note 列
    add_column_if_missing(
        conn,
        "shopping_space_definitions",
        "note",
        "TEXT NOT NULL DEFAULT ''",
    )?;

    // 统一物品表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            lane TEXT,
            lifecycle TEXT NOT NULL,
            depreciation TEXT,
            entry_price REAL,
            sweet_spot_price REAL,
            overpay_price REAL,
            note TEXT NOT NULL DEFAULT '',
            quantity INTEGER,
            health_status TEXT,
            replacement_cue TEXT,
            reason TEXT,
            target_lifestyle TEXT,
            current_price REAL,
            buy_below_price REAL,
            keywords_json TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 物品子级
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_item_children (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT,
            lifecycle TEXT,
            depreciation TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES shopping_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    add_column_if_missing(conn, "shopping_item_children", "status", "TEXT")?;
    add_column_if_missing(conn, "shopping_item_children", "lifecycle", "TEXT")?;
    add_column_if_missing(conn, "shopping_item_children", "depreciation", "TEXT")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_item_child_channels (
            id TEXT PRIMARY KEY,
            item_child_id TEXT NOT NULL,
            channel TEXT NOT NULL,
            entry_price REAL,
            sweet_spot_price REAL,
            overpay_price REAL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_child_id) REFERENCES shopping_item_children(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 物品-系统标签(多对多)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_item_systems (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            system_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES shopping_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 物品-空间标签(多对多)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_item_spaces (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            space_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES shopping_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 物品-渠道(多对多)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_item_channels (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            channel TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES shopping_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 阶段模板
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_stage_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            focus TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 阶段物品
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_stage_items (
            id TEXT PRIMARY KEY,
            stage_template_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (stage_template_id) REFERENCES shopping_stage_templates(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_stage_template_system_dimensions (
            id TEXT PRIMARY KEY,
            stage_template_id TEXT NOT NULL,
            system_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (stage_template_id) REFERENCES shopping_stage_templates(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_stage_template_space_dimensions (
            id TEXT PRIMARY KEY,
            stage_template_id TEXT NOT NULL,
            space_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (stage_template_id) REFERENCES shopping_stage_templates(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 阶段物品三档配置
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_stage_item_tiers (
            id TEXT PRIMARY KEY,
            stage_item_id TEXT NOT NULL,
            tier TEXT NOT NULL,
            item_child_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (stage_item_id) REFERENCES shopping_stage_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 保留 page_content,用于展示类内容(spotlight, boundary, lifestyle)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_page_content (
            id TEXT PRIMARY KEY,
            content_type TEXT NOT NULL,
            title TEXT,
            stage TEXT,
            system_id TEXT,
            summary TEXT,
            reason TEXT,
            body_json TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    column_def: &str,
) -> SqliteResult<()> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let columns = stmt.query_map([], |row| row.get::<_, String>(1))?;
    let mut exists = false;
    for col in columns {
        if col? == column {
            exists = true;
            break;
        }
    }
    if !exists {
        conn.execute(
            &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, column_def),
            [],
        )?;
    }
    Ok(())
}

fn seed_new_tables(conn: &Connection) -> SqliteResult<()> {
    let seed_json = include_str!("seed.json");
    let seed: serde_json::Value =
        serde_json::from_str(seed_json).expect("Failed to parse seed.json");

    let now = chrono_now();

    // ---- System definitions ----
    if table_is_empty(conn, "shopping_system_definitions")? {
        if let Some(defs) = seed["systemDefinitions"].as_array() {
            for (i, def) in defs.iter().enumerate() {
                conn.execute(
                    "INSERT INTO shopping_system_definitions (id, name, summary, key_question, secondary_groups_json, sort_order, is_enabled, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)",
                    rusqlite::params![
                        def["id"].as_str().unwrap_or(""),
                        def["name"].as_str().unwrap_or(""),
                        def["summary"].as_str().unwrap_or(""),
                        def["keyQuestion"].as_str().unwrap_or(""),
                        serde_json::to_string(&def["secondaryGroups"]).unwrap_or_default(),
                        i as i32,
                        now,
                        now,
                    ],
                )?;
            }
        }
    }

    // ---- Space definitions ----
    if table_is_empty(conn, "shopping_space_definitions")? {
        if let Some(spaces) = seed["spaceDefinitions"].as_array() {
            for (i, space) in spaces.iter().enumerate() {
                conn.execute(
                "INSERT INTO shopping_space_definitions (id, name, note, sort_order, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    space["id"].as_str().unwrap_or(""),
                    space["name"].as_str().unwrap_or(""),
                    space["note"].as_str().unwrap_or(""),
                    i as i32,
                    now,
                    now,
                ],
            )?;
            }
        }
    }

    // ---- Items ----
    if table_is_empty(conn, "shopping_items")? {
        if let Some(items) = seed["items"].as_array() {
            for (i, item) in items.iter().enumerate() {
                let item_id = item["id"].as_str().unwrap_or("");
                conn.execute(
                "INSERT INTO shopping_items (
                    id, name, status, lane, lifecycle, depreciation,
                    entry_price, sweet_spot_price, overpay_price,
                    note, quantity, health_status, replacement_cue,
                    reason, target_lifestyle, current_price, buy_below_price, keywords_json,
                    sort_order, is_archived, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, 0, ?20, ?21)",
                rusqlite::params![
                    item_id,
                    item["name"].as_str().unwrap_or(""),
                    item["status"].as_str().unwrap_or("Owned"),
                    item["lane"].as_str(),
                    item["lifecycle"].as_str().unwrap_or("Durable"),
                    item["depreciation"].as_str(),
                    item["entryPrice"].as_f64(),
                    item["sweetSpotPrice"].as_f64(),
                    item["overpayPrice"].as_f64(),
                    item["note"].as_str().unwrap_or(""),
                    item["quantity"].as_i64().map(|v| v as i32),
                    item["healthStatus"].as_str(),
                    item["replacementCue"].as_str(),
                    item["reason"].as_str(),
                    item["targetLifestyle"].as_str(),
                    item["currentPrice"].as_f64(),
                    item["buyBelowPrice"].as_f64(),
                    item["keywords"].as_array().map(|arr| serde_json::to_string(arr).unwrap_or_default()),
                    i as i32,
                    now,
                    now,
                ],
            )?;

                // 子级
                if let Some(children) = item["children"].as_array() {
                    for (j, child) in children.iter().enumerate() {
                        let child_id = child["id"]
                            .as_str()
                            .map(ToOwned::to_owned)
                            .unwrap_or_else(|| format!("{}_child_{}", item_id, j));
                        conn.execute(
                            "INSERT INTO shopping_item_children (
                                id, item_id, name, status, lifecycle, depreciation, sort_order
                             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                            rusqlite::params![
                                &child_id,
                                item_id,
                                child["name"].as_str().unwrap_or(""),
                                child["status"].as_str(),
                                child["lifecycle"].as_str(),
                                child["depreciation"].as_str(),
                                j as i32
                            ],
                        )?;

                        if let Some(channel_prices) = child["channelPrices"].as_array() {
                            for (channel_index, channel) in channel_prices.iter().enumerate() {
                                conn.execute(
                                    "INSERT INTO shopping_item_child_channels (
                                        id, item_child_id, channel, entry_price, sweet_spot_price, overpay_price, sort_order
                                     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                                    rusqlite::params![
                                        channel["id"]
                                            .as_str()
                                            .map(ToOwned::to_owned)
                                            .unwrap_or_else(|| format!("{}_channel_{}", child_id, channel_index)),
                                        &child_id,
                                        channel["channel"].as_str().unwrap_or(""),
                                        channel["entryPrice"].as_f64(),
                                        channel["sweetSpotPrice"].as_f64(),
                                        channel["overpayPrice"].as_f64(),
                                        channel_index as i32,
                                    ],
                                )?;
                            }
                        }
                    }
                }

                // 系统标签
                if let Some(tags) = item["systemTags"].as_array() {
                    for (j, tag) in tags.iter().enumerate() {
                        conn.execute(
                            "INSERT INTO shopping_item_systems (id, item_id, system_id, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                            rusqlite::params![
                                format!("{}_sys_{}", item_id, j),
                                item_id,
                                tag.as_str().unwrap_or(""),
                                j as i32,
                            ],
                        )?;
                    }
                }

                // 空间标签
                if let Some(tags) = item["spaceTags"].as_array() {
                    for (j, tag) in tags.iter().enumerate() {
                        conn.execute(
                            "INSERT INTO shopping_item_spaces (id, item_id, space_id, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                            rusqlite::params![
                                format!("{}_spc_{}", item_id, j),
                                item_id,
                                tag.as_str().unwrap_or(""),
                                j as i32,
                            ],
                        )?;
                    }
                }

                // 渠道
                if let Some(channels) = item["channels"].as_array() {
                    for (j, ch) in channels.iter().enumerate() {
                        conn.execute(
                            "INSERT INTO shopping_item_channels (id, item_id, channel, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                            rusqlite::params![
                                format!("{}_ch_{}", item_id, j),
                                item_id,
                                ch.as_str().unwrap_or(""),
                                j as i32,
                            ],
                        )?;
                    }
                }
            }
        }
    }

    // ---- Stage templates ----
    if table_is_empty(conn, "shopping_stage_templates")? {
        if let Some(stages) = seed["stageTemplates"].as_array() {
            for (i, stage) in stages.iter().enumerate() {
                let stage_id = stage["id"].as_str().unwrap_or("");
                conn.execute(
                "INSERT INTO shopping_stage_templates (id, name, description, focus, sort_order, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![
                    stage_id,
                    stage["name"].as_str().unwrap_or(""),
                    stage["description"].as_str().unwrap_or(""),
                    stage["focus"].as_str().unwrap_or(""),
                    i as i32,
                    now,
                    now,
                ],
            )?;

                if let Some(items) = stage["items"].as_array() {
                    for (j, si) in items.iter().enumerate() {
                        let stage_item_id = format!("{}_si_{}", stage_id, j);
                        conn.execute(
                        "INSERT INTO shopping_stage_items (id, stage_template_id, item_id, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                        rusqlite::params![
                            stage_item_id,
                            stage_id,
                            si["itemId"].as_str().unwrap_or(""),
                            j as i32,
                        ],
                    )?;

                        // 三档配置
                        for tier in &["low", "base", "up"] {
                            if let Some(child_ids) = si["tiers"][tier].as_array() {
                                for (k, child_id) in child_ids.iter().enumerate() {
                                    conn.execute(
                                    "INSERT INTO shopping_stage_item_tiers (id, stage_item_id, tier, item_child_id, sort_order)
                                     VALUES (?1, ?2, ?3, ?4, ?5)",
                                    rusqlite::params![
                                        format!("{}_{}_{}", stage_item_id, tier, k),
                                        stage_item_id,
                                        tier,
                                        child_id.as_str().unwrap_or(""),
                                        k as i32,
                                    ],
                                )?;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ---- 展示类内容(spotlight / boundary / lifestyle) ----
    if table_is_empty(conn, "shopping_page_content")? {
        if let Some(spotlights) = seed["spotlights"].as_array() {
            for (i, s) in spotlights.iter().enumerate() {
                let body = serde_json::json!({ "attention": s["attention"] });
                conn.execute(
                "INSERT INTO shopping_page_content (id, content_type, title, stage, summary, reason, body_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, 'spotlight', ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?9)",
                rusqlite::params![
                    s["id"].as_str().unwrap_or(""),
                    s["title"].as_str().unwrap_or(""),
                    s["stage"].as_str().unwrap_or(""),
                    s["summary"].as_str().unwrap_or(""),
                    s["reason"].as_str().unwrap_or(""),
                    serde_json::to_string(&body).unwrap_or_default(),
                    i as i32,
                    now,
                    now,
                ],
            )?;
            }
        }

        if let Some(entries) = seed["boundaryEntries"].as_array() {
            for (i, entry) in entries.iter().enumerate() {
                let body = serde_json::json!({ "item": entry["item"], "reason": entry["reason"] });
                conn.execute(
                "INSERT INTO shopping_page_content (id, content_type, system_id, body_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, 'boundary_entry', ?2, ?3, ?4, 1, ?5, ?6)",
                rusqlite::params![
                    entry["id"].as_str().unwrap_or(""),
                    entry["system"].as_str().unwrap_or(""),
                    serde_json::to_string(&body).unwrap_or_default(),
                    i as i32,
                    now,
                    now,
                ],
            )?;
            }
        }

        if let Some(collections) = seed["lifestyleCollections"].as_array() {
            for (i, col) in collections.iter().enumerate() {
                let body =
                    serde_json::json!({ "description": col["description"], "items": col["items"] });
                conn.execute(
                "INSERT INTO shopping_page_content (id, content_type, title, body_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, 'lifestyle_collection', ?2, ?3, ?4, 1, ?5, ?6)",
                rusqlite::params![
                    col["id"].as_str().unwrap_or(""),
                    col["title"].as_str().unwrap_or(""),
                    serde_json::to_string(&body).unwrap_or_default(),
                    i as i32,
                    now,
                    now,
                ],
            )?;
            }
        }
    }

    Ok(())
}

/// Get current time as ISO 8601 string.
pub fn chrono_now() -> String {
    chrono::Utc::now().to_rfc3339()
}
