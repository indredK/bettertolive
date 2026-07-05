use rusqlite::{params, Connection, Result as SqliteResult};

pub fn initialize_legacy_schema(conn: &Connection) -> SqliteResult<()> {
    create_schema(conn)?;
    seed_tables(conn)?;
    Ok(())
}

fn table_is_empty(conn: &Connection, table: &str) -> SqliteResult<bool> {
    let count: i64 = conn.query_row(&format!("SELECT COUNT(*) FROM {}", table), [], |row| {
        row.get(0)
    })?;
    Ok(count == 0)
}

fn create_schema(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS legacy_items (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            recipient TEXT NOT NULL,
            recipient_name TEXT,
            related_relationship_id TEXT,
            urgency TEXT NOT NULL,
            visibility TEXT NOT NULL,
            delivery_condition TEXT,
            status TEXT NOT NULL,
            emotional_load TEXT,
            summary TEXT NOT NULL,
            content TEXT NOT NULL,
            is_locked INTEGER NOT NULL DEFAULT 0,
            requires_second_confirm INTEGER NOT NULL DEFAULT 0,
            exclude_from_ai INTEGER NOT NULL DEFAULT 0,
            review_cue TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            finalized_at TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS legacy_item_tags (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            tag TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES legacy_items(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS legacy_trust_boundaries (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            detail TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS legacy_review_prompts (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    Ok(())
}

pub(crate) fn seed_tables(conn: &Connection) -> SqliteResult<()> {
    let seed_json = include_str!("initial.json");
    let seed: serde_json::Value = serde_json::from_str(seed_json).map_err(|e| {
        rusqlite::Error::InvalidParameterName(format!("Failed to parse legacy seed.json: {}", e))
    })?;

    if table_is_empty(conn, "legacy_items")? {
        if let Some(items) = seed["items"].as_array() {
            for (index, item) in items.iter().enumerate() {
                let item_id = item["id"].as_str().unwrap_or("");
                conn.execute(
                    "INSERT INTO legacy_items (
                        id, title, category, recipient, recipient_name, related_relationship_id,
                        urgency, visibility, delivery_condition, status, emotional_load,
                        summary, content, is_locked, requires_second_confirm, exclude_from_ai,
                        review_cue, sort_order, is_archived, created_at, updated_at, finalized_at
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, 0, ?19, ?20, ?21)",
                    params![
                        item_id,
                        item["title"].as_str().unwrap_or(""),
                        item["category"].as_str().unwrap_or("重要交代"),
                        item["recipient"].as_str().unwrap_or("仅自己"),
                        item["recipientName"].as_str(),
                        item["relatedRelationshipId"].as_str(),
                        item["urgency"].as_str().unwrap_or("重要"),
                        item["visibility"].as_str().unwrap_or("永不交付"),
                        item["deliveryCondition"].as_str(),
                        item["status"].as_str().unwrap_or("草稿"),
                        item["emotionalLoad"].as_str(),
                        item["summary"].as_str().unwrap_or(""),
                        item["content"].as_str().unwrap_or_else(|| item["contentPreview"].as_str().unwrap_or("")),
                        item["isLocked"].as_bool().unwrap_or(false),
                        item["requiresSecondConfirm"].as_bool().unwrap_or(false),
                        item["excludeFromAi"].as_bool().unwrap_or(false),
                        item["reviewCue"].as_str().unwrap_or(""),
                        index as i32,
                        item["createdAt"].as_str().unwrap_or("2026-01-01"),
                        item["updatedAt"].as_str().unwrap_or("2026-01-01"),
                        item["finalizedAt"].as_str(),
                    ],
                )?;

                if let Some(tags) = item["tags"].as_array() {
                    for (tag_index, tag) in tags.iter().enumerate() {
                        conn.execute(
                            "INSERT INTO legacy_item_tags (id, item_id, tag, sort_order)
                             VALUES (?1, ?2, ?3, ?4)",
                            params![
                                format!("{}_tag_{}", item_id, tag_index),
                                item_id,
                                tag.as_str().unwrap_or(""),
                                tag_index as i32,
                            ],
                        )?;
                    }
                }
            }
        }
    }

    if table_is_empty(conn, "legacy_trust_boundaries")? {
        if let Some(boundaries) = seed["trustBoundaries"].as_array() {
            for (index, boundary) in boundaries.iter().enumerate() {
                conn.execute(
                    "INSERT INTO legacy_trust_boundaries (id, title, detail, sort_order)
                     VALUES (?1, ?2, ?3, ?4)",
                    params![
                        boundary["id"].as_str().unwrap_or(""),
                        boundary["title"].as_str().unwrap_or(""),
                        boundary["detail"].as_str().unwrap_or(""),
                        index as i32,
                    ],
                )?;
            }
        }
    }

    if table_is_empty(conn, "legacy_review_prompts")? {
        if let Some(prompts) = seed["reviewPrompts"].as_array() {
            for (index, prompt) in prompts.iter().enumerate() {
                conn.execute(
                    "INSERT INTO legacy_review_prompts (id, prompt, sort_order)
                     VALUES (?1, ?2, ?3)",
                    params![
                        format!("legacy-review-prompt-{}", index + 1),
                        prompt.as_str().unwrap_or(""),
                        index as i32,
                    ],
                )?;
            }
        }
    }

    Ok(())
}
