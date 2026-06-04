use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

/// Create or open the SQLite database and ensure the schema is set up.
pub fn initialize_database(db_path: &Path) -> SqliteResult<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for better read concurrency
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    // Create the legacy shopping module content table (kept for backward compatibility)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_module_content (
            id TEXT PRIMARY KEY,
            module_key TEXT NOT NULL UNIQUE,
            content_json TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            CHECK (json_valid(content_json))
        )",
        [],
    )?;

    // ---- New CRUD tables ----

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_system_definitions (
            id TEXT PRIMARY KEY,
            cluster TEXT NOT NULL,
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_owned_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            system_id TEXT NOT NULL,
            category TEXT NOT NULL,
            necessity TEXT NOT NULL,
            lifecycle TEXT NOT NULL,
            depreciation TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL,
            replacement_cue TEXT NOT NULL,
            note TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (system_id) REFERENCES shopping_system_definitions(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_owned_item_spaces (
            id TEXT PRIMARY KEY,
            owned_item_id TEXT NOT NULL,
            space_name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_owned_item_stages (
            id TEXT PRIMARY KEY,
            owned_item_id TEXT NOT NULL,
            stage_name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (owned_item_id) REFERENCES shopping_owned_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_purchase_lanes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_plan_items (
            id TEXT PRIMARY KEY,
            lane_id TEXT NOT NULL,
            name TEXT NOT NULL,
            system_id TEXT NOT NULL,
            category TEXT NOT NULL,
            necessity TEXT NOT NULL,
            lifecycle TEXT NOT NULL,
            depreciation TEXT,
            reason TEXT NOT NULL,
            target_lifestyle TEXT NOT NULL,
            current_price REAL NOT NULL,
            buy_below_price REAL NOT NULL,
            overpay_price REAL NOT NULL,
            note TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (lane_id) REFERENCES shopping_purchase_lanes(id),
            FOREIGN KEY (system_id) REFERENCES shopping_system_definitions(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_plan_item_spaces (
            id TEXT PRIMARY KEY,
            plan_item_id TEXT NOT NULL,
            space_name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_plan_item_stages (
            id TEXT PRIMARY KEY,
            plan_item_id TEXT NOT NULL,
            stage_name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_plan_item_tags (
            id TEXT PRIMARY KEY,
            plan_item_id TEXT NOT NULL,
            tag_value TEXT NOT NULL,
            tag_type TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (plan_item_id) REFERENCES shopping_plan_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

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

    // Seed the new tables if they are empty
    seed_new_tables(&conn)?;

    // Legacy seed: keep the old table populated for backward compatibility
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM shopping_module_content WHERE module_key = 'shopping'",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        seed_legacy_shopping_data(&conn)?;
    }

    Ok(conn)
}

fn seed_new_tables(conn: &Connection) -> SqliteResult<()> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM shopping_system_definitions",
        [],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Ok(()); // Already seeded
    }

    let seed_json = include_str!("seed.json");
    let seed: serde_json::Value =
        serde_json::from_str(seed_json).expect("Failed to parse seed.json");

    let now = chrono_now();

    // Seed system_definitions
    if let Some(defs) = seed["systemDefinitions"].as_array() {
        for (i, def) in defs.iter().enumerate() {
            conn.execute(
                "INSERT INTO shopping_system_definitions (id, cluster, summary, key_question, secondary_groups_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)",
                rusqlite::params![
                    def["id"].as_str().unwrap_or(""),
                    def["cluster"].as_str().unwrap_or(""),
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

    // Seed owned_items
    if let Some(items) = seed["ownedItems"].as_array() {
        for (i, item) in items.iter().enumerate() {
            let item_id = item["id"].as_str().unwrap_or("");
            conn.execute(
                "INSERT INTO shopping_owned_items (id, name, system_id, category, necessity, lifecycle, depreciation, quantity, status, replacement_cue, note, sort_order, is_archived, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0, ?13, ?14)",
                rusqlite::params![
                    item_id,
                    item["name"].as_str().unwrap_or(""),
                    item["system"].as_str().unwrap_or(""),
                    item["category"].as_str().unwrap_or(""),
                    item["necessity"].as_str().unwrap_or(""),
                    item["lifecycle"].as_str().unwrap_or(""),
                    item["depreciation"].as_str(),
                    item["quantity"].as_i64().unwrap_or(1),
                    item["status"].as_str().unwrap_or(""),
                    item["replacementCue"].as_str().unwrap_or(""),
                    item["note"].as_str().unwrap_or(""),
                    i as i32,
                    now,
                    now,
                ],
            )?;

            // Seed owned_item_spaces
            if let Some(spaces) = item["spaces"].as_array() {
                for (j, space) in spaces.iter().enumerate() {
                    conn.execute(
                        "INSERT INTO shopping_owned_item_spaces (id, owned_item_id, space_name, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                        rusqlite::params![
                            format!("{}_space_{}", item_id, j),
                            item_id,
                            space.as_str().unwrap_or(""),
                            j as i32,
                        ],
                    )?;
                }
            }

            // Seed owned_item_stages
            if let Some(stages) = item["stages"].as_array() {
                for (j, stage) in stages.iter().enumerate() {
                    conn.execute(
                        "INSERT INTO shopping_owned_item_stages (id, owned_item_id, stage_name, sort_order)
                         VALUES (?1, ?2, ?3, ?4)",
                        rusqlite::params![
                            format!("{}_stage_{}", item_id, j),
                            item_id,
                            stage.as_str().unwrap_or(""),
                            j as i32,
                        ],
                    )?;
                }
            }
        }
    }

    // Seed purchase_lanes and plan_items
    if let Some(lanes) = seed["purchaseLanes"].as_array() {
        for (lane_idx, lane) in lanes.iter().enumerate() {
            let lane_id = lane["id"].as_str().unwrap_or("");
            conn.execute(
                "INSERT INTO shopping_purchase_lanes (id, title, subtitle, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6)",
                rusqlite::params![
                    lane_id,
                    lane["title"].as_str().unwrap_or(""),
                    lane["subtitle"].as_str().unwrap_or(""),
                    lane_idx as i32,
                    now,
                    now,
                ],
            )?;

            if let Some(items) = lane["items"].as_array() {
                for (item_idx, item) in items.iter().enumerate() {
                    let item_id = item["id"].as_str().unwrap_or("");
                    conn.execute(
                        "INSERT INTO shopping_plan_items (id, lane_id, name, system_id, category, necessity, lifecycle, depreciation, reason, target_lifestyle, current_price, buy_below_price, overpay_price, note, sort_order, is_archived, created_at, updated_at)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 0, ?16, ?17)",
                        rusqlite::params![
                            item_id,
                            lane_id,
                            item["name"].as_str().unwrap_or(""),
                            item["system"].as_str().unwrap_or(""),
                            item["category"].as_str().unwrap_or(""),
                            item["necessity"].as_str().unwrap_or(""),
                            item["lifecycle"].as_str().unwrap_or(""),
                            item["depreciation"].as_str(),
                            item["reason"].as_str().unwrap_or(""),
                            item["targetLifestyle"].as_str().unwrap_or(""),
                            item["currentPrice"].as_f64().unwrap_or(0.0),
                            item["buyBelowPrice"].as_f64().unwrap_or(0.0),
                            item["overpayPrice"].as_f64().unwrap_or(0.0),
                            item["note"].as_str().unwrap_or(""),
                            item_idx as i32,
                            now,
                            now,
                        ],
                    )?;

                    // Seed plan_item_spaces
                    if let Some(spaces) = item["spaces"].as_array() {
                        for (j, space) in spaces.iter().enumerate() {
                            conn.execute(
                                "INSERT INTO shopping_plan_item_spaces (id, plan_item_id, space_name, sort_order)
                                 VALUES (?1, ?2, ?3, ?4)",
                                rusqlite::params![
                                    format!("{}_space_{}", item_id, j),
                                    item_id,
                                    space.as_str().unwrap_or(""),
                                    j as i32,
                                ],
                            )?;
                        }
                    }

                    // Seed plan_item_stages
                    if let Some(stages) = item["stages"].as_array() {
                        for (j, stage) in stages.iter().enumerate() {
                            conn.execute(
                                "INSERT INTO shopping_plan_item_stages (id, plan_item_id, stage_name, sort_order)
                                 VALUES (?1, ?2, ?3, ?4)",
                                rusqlite::params![
                                    format!("{}_stage_{}", item_id, j),
                                    item_id,
                                    stage.as_str().unwrap_or(""),
                                    j as i32,
                                ],
                            )?;
                        }
                    }

                    // Seed plan_item_tags (tags)
                    if let Some(tags) = item["tags"].as_array() {
                        for (j, tag) in tags.iter().enumerate() {
                            conn.execute(
                                "INSERT INTO shopping_plan_item_tags (id, plan_item_id, tag_value, tag_type, sort_order)
                                 VALUES (?1, ?2, ?3, 'tag', ?4)",
                                rusqlite::params![
                                    format!("{}_tag_{}", item_id, j),
                                    item_id,
                                    tag.as_str().unwrap_or(""),
                                    j as i32,
                                ],
                            )?;
                        }
                    }

                    // Seed plan_item_tags (keywords)
                    if let Some(keywords) = item["keywords"].as_array() {
                        for (j, kw) in keywords.iter().enumerate() {
                            conn.execute(
                                "INSERT INTO shopping_plan_item_tags (id, plan_item_id, tag_value, tag_type, sort_order)
                                 VALUES (?1, ?2, ?3, 'keyword', ?4)",
                                rusqlite::params![
                                    format!("{}_kw_{}", item_id, j),
                                    item_id,
                                    kw.as_str().unwrap_or(""),
                                    j as i32,
                                ],
                            )?;
                        }
                    }
                }
            }
        }
    }

    // Seed page_content: spotlights
    if let Some(spotlights) = seed["spotlights"].as_array() {
        for (i, s) in spotlights.iter().enumerate() {
            let body = serde_json::json!({
                "attention": s["attention"]
            });
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

    // Seed page_content: stage_checklists
    if let Some(checklists) = seed["stageChecklists"].as_array() {
        for (i, cl) in checklists.iter().enumerate() {
            let body = serde_json::json!({
                "description": cl["description"],
                "focus": cl["focus"],
                "sections": cl["sections"]
            });
            conn.execute(
                "INSERT INTO shopping_page_content (id, content_type, title, stage, body_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, 'stage_checklist', ?2, ?3, ?4, ?5, 1, ?6, ?7)",
                rusqlite::params![
                    cl["id"].as_str().unwrap_or(""),
                    cl["title"].as_str().unwrap_or(""),
                    cl["stage"].as_str().unwrap_or(""),
                    serde_json::to_string(&body).unwrap_or_default(),
                    i as i32,
                    now,
                    now,
                ],
            )?;
        }
    }

    // Seed page_content: price_references
    if let Some(price_refs) = seed["priceReferences"].as_array() {
        for (i, pr) in price_refs.iter().enumerate() {
            let body = serde_json::json!({
                "category": pr["category"],
                "lifecycle": pr["lifecycle"],
                "depreciation": pr["depreciation"],
                "entryPrice": pr["entryPrice"],
                "sweetSpotPrice": pr["sweetSpotPrice"],
                "overpayPrice": pr["overpayPrice"],
                "note": pr["note"]
            });
            conn.execute(
                "INSERT INTO shopping_page_content (id, content_type, system_id, body_json, sort_order, is_enabled, created_at, updated_at)
                 VALUES (?1, 'price_reference', ?2, ?3, ?4, 1, ?5, ?6)",
                rusqlite::params![
                    pr["id"].as_str().unwrap_or(""),
                    pr["system"].as_str().unwrap_or(""),
                    serde_json::to_string(&body).unwrap_or_default(),
                    i as i32,
                    now,
                    now,
                ],
            )?;
        }
    }

    // Seed page_content: boundary_entries
    if let Some(entries) = seed["boundaryEntries"].as_array() {
        for (i, entry) in entries.iter().enumerate() {
            let body = serde_json::json!({
                "item": entry["item"],
                "reason": entry["reason"]
            });
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

    // Seed page_content: lifestyle_collections
    if let Some(collections) = seed["lifestyleCollections"].as_array() {
        for (i, col) in collections.iter().enumerate() {
            let body = serde_json::json!({
                "description": col["description"],
                "items": col["items"]
            });
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

    Ok(())
}

fn seed_legacy_shopping_data(conn: &Connection) -> SqliteResult<()> {
    let seed_json = include_str!("seed.json");
    let now = chrono_now();

    conn.execute(
        "INSERT INTO shopping_module_content (id, module_key, content_json, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params!["seed-shopping-001", "shopping", seed_json, 1, now, now],
    )?;

    Ok(())
}

/// Get current time as ISO 8601 string.
pub fn chrono_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();

    let days_since_epoch = secs / 86400;
    let time_of_day = secs % 86400;

    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    let mut year = 1970i64;
    let mut remaining_days = days_since_epoch as i32;

    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }

    let month_days = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut month = 1;
    for &md in month_days.iter() {
        if remaining_days < md {
            break;
        }
        remaining_days -= md;
        month += 1;
    }

    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn is_leap_year(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}
