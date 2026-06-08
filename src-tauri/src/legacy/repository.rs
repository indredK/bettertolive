use crate::legacy::dto::{
    LegacyItemDto, LegacyItemFormDto, LegacyModuleDto, LegacyTrustBoundaryDto,
};
use rusqlite::{params, Connection};

pub struct LegacyRepository;

struct LegacyItemRow {
    id: String,
    title: String,
    category: String,
    recipient: String,
    recipient_name: Option<String>,
    related_relationship_id: Option<String>,
    urgency: String,
    visibility: String,
    delivery_condition: Option<String>,
    status: String,
    emotional_load: Option<String>,
    summary: String,
    content: String,
    is_locked: bool,
    requires_second_confirm: bool,
    exclude_from_ai: bool,
    created_at: String,
    updated_at: String,
    finalized_at: Option<String>,
    review_cue: String,
}

fn normalize_optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn make_content_preview(content: &str) -> String {
    let trimmed = content.trim();
    let mut preview = trimmed.chars().take(96).collect::<String>();
    if trimmed.chars().count() > 96 {
        preview.push('…');
    }
    preview
}

fn row_to_item(row: &rusqlite::Row) -> rusqlite::Result<LegacyItemRow> {
    Ok(LegacyItemRow {
        id: row.get("id")?,
        title: row.get("title")?,
        category: row.get("category")?,
        recipient: row.get("recipient")?,
        recipient_name: row.get("recipient_name")?,
        related_relationship_id: row.get("related_relationship_id")?,
        urgency: row.get("urgency")?,
        visibility: row.get("visibility")?,
        delivery_condition: row.get("delivery_condition")?,
        status: row.get("status")?,
        emotional_load: row.get("emotional_load")?,
        summary: row.get("summary")?,
        content: row.get("content")?,
        is_locked: row.get("is_locked")?,
        requires_second_confirm: row.get("requires_second_confirm")?,
        exclude_from_ai: row.get("exclude_from_ai")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        finalized_at: row.get("finalized_at")?,
        review_cue: row.get("review_cue")?,
    })
}

impl LegacyRepository {
    pub fn get_legacy_module(conn: &Connection) -> Result<LegacyModuleDto, String> {
        Ok(LegacyModuleDto {
            items: Self::list_items(conn)?,
            trust_boundaries: Self::list_trust_boundaries(conn)?,
            review_prompts: Self::list_review_prompts(conn)?,
        })
    }

    pub fn list_items(conn: &Connection) -> Result<Vec<LegacyItemDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT * FROM legacy_items
                 WHERE is_archived = 0
                 ORDER BY sort_order, updated_at DESC, id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], row_to_item).map_err(|e| e.to_string())?;

        let mut items = Vec::new();
        for row in rows {
            items.push(Self::hydrate_item(conn, row.map_err(|e| e.to_string())?)?);
        }
        Ok(items)
    }

    pub fn get_item_by_id(conn: &Connection, id: &str) -> Result<Option<LegacyItemDto>, String> {
        let mut stmt = conn
            .prepare("SELECT * FROM legacy_items WHERE id = ?1 AND is_archived = 0")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map(params![id], row_to_item)
            .map_err(|e| e.to_string())?;

        if let Some(row) = rows.next() {
            Ok(Some(Self::hydrate_item(
                conn,
                row.map_err(|e| e.to_string())?,
            )?))
        } else {
            Ok(None)
        }
    }

    fn hydrate_item(conn: &Connection, row: LegacyItemRow) -> Result<LegacyItemDto, String> {
        let tags = Self::list_tags_for_item(conn, &row.id)?;
        Ok(LegacyItemDto {
            id: row.id,
            title: row.title,
            category: row.category,
            recipient: row.recipient,
            recipient_name: row.recipient_name,
            related_relationship_id: row.related_relationship_id,
            urgency: row.urgency,
            visibility: row.visibility,
            delivery_condition: row.delivery_condition,
            status: row.status,
            emotional_load: row.emotional_load,
            summary: row.summary,
            content_preview: make_content_preview(&row.content),
            content: row.content,
            is_locked: row.is_locked,
            requires_second_confirm: row.requires_second_confirm,
            exclude_from_ai: row.exclude_from_ai,
            created_at: row.created_at,
            updated_at: row.updated_at,
            finalized_at: row.finalized_at,
            review_cue: row.review_cue,
            tags,
        })
    }

    fn list_tags_for_item(conn: &Connection, item_id: &str) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT tag FROM legacy_item_tags
                 WHERE item_id = ?1
                 ORDER BY sort_order, tag",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![item_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        let mut tags = Vec::new();
        for row in rows {
            tags.push(row.map_err(|e| e.to_string())?);
        }
        Ok(tags)
    }

    fn list_trust_boundaries(conn: &Connection) -> Result<Vec<LegacyTrustBoundaryDto>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, detail FROM legacy_trust_boundaries
                 ORDER BY sort_order, id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(LegacyTrustBoundaryDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    detail: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut boundaries = Vec::new();
        for row in rows {
            boundaries.push(row.map_err(|e| e.to_string())?);
        }
        Ok(boundaries)
    }

    fn list_review_prompts(conn: &Connection) -> Result<Vec<String>, String> {
        let mut stmt = conn
            .prepare("SELECT prompt FROM legacy_review_prompts ORDER BY sort_order, id")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        let mut prompts = Vec::new();
        for row in rows {
            prompts.push(row.map_err(|e| e.to_string())?);
        }
        Ok(prompts)
    }

    pub fn upsert_item(
        conn: &Connection,
        id: &str,
        form: &LegacyItemFormDto,
        is_update: bool,
        now: &str,
    ) -> Result<(), String> {
        let title = form.title.trim();
        if title.is_empty() {
            return Err("title is required".to_string());
        }

        if form.summary.trim().is_empty() {
            return Err("summary is required".to_string());
        }

        if form.content.trim().is_empty() {
            return Err("content is required".to_string());
        }

        let recipient_name = normalize_optional_text(form.recipient_name.as_deref());
        let related_relationship_id =
            normalize_optional_text(form.related_relationship_id.as_deref());
        let delivery_condition = normalize_optional_text(form.delivery_condition.as_deref());
        let emotional_load = normalize_optional_text(form.emotional_load.as_deref());
        let status = form.status.trim();
        let visibility = form.visibility.trim();
        let urgency = form.urgency.trim();
        let is_final = status == "最终版";
        if is_final && urgency == "关键信息" && delivery_condition.is_none() {
            return Err("critical final items require a delivery condition".to_string());
        }

        let is_locked = form.is_locked || is_final;
        let requires_second_confirm =
            form.requires_second_confirm || emotional_load.as_deref() == Some("很重");
        let exclude_from_ai = form.exclude_from_ai
            || form.recipient.trim() == "仅自己"
            || emotional_load.as_deref() == Some("很重")
            || form.visibility.trim() == "我离世后";
        let finalized_at = if is_final {
            Some(now.to_string())
        } else {
            None
        };

        if is_update {
            conn.execute(
                "UPDATE legacy_items SET
                    title = ?2,
                    category = ?3,
                    recipient = ?4,
                    recipient_name = ?5,
                    related_relationship_id = ?6,
                    urgency = ?7,
                    visibility = ?8,
                    delivery_condition = ?9,
                    status = ?10,
                    emotional_load = ?11,
                    summary = ?12,
                    content = ?13,
                    is_locked = ?14,
                    requires_second_confirm = ?15,
                    exclude_from_ai = ?16,
                    review_cue = ?17,
                    updated_at = ?18,
                    finalized_at = CASE
                        WHEN ?19 IS NULL THEN NULL
                        ELSE COALESCE(finalized_at, ?19)
                    END
                 WHERE id = ?1 AND is_archived = 0",
                params![
                    id,
                    title,
                    form.category.trim(),
                    form.recipient.trim(),
                    recipient_name.as_deref(),
                    related_relationship_id.as_deref(),
                    urgency,
                    visibility,
                    delivery_condition.as_deref(),
                    status,
                    emotional_load.as_deref(),
                    form.summary.trim(),
                    form.content.trim(),
                    is_locked,
                    requires_second_confirm,
                    exclude_from_ai,
                    form.review_cue.trim(),
                    now,
                    finalized_at.as_deref(),
                ],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM legacy_item_tags WHERE item_id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
        } else {
            let next_order: i32 = conn
                .query_row(
                    "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM legacy_items",
                    [],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO legacy_items (
                    id, title, category, recipient, recipient_name, related_relationship_id,
                    urgency, visibility, delivery_condition, status, emotional_load,
                    summary, content, is_locked, requires_second_confirm, exclude_from_ai,
                    review_cue, sort_order, is_archived, created_at, updated_at, finalized_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, 0, ?19, ?20, ?21)",
                params![
                    id,
                    title,
                    form.category.trim(),
                    form.recipient.trim(),
                    recipient_name.as_deref(),
                    related_relationship_id.as_deref(),
                    urgency,
                    visibility,
                    delivery_condition.as_deref(),
                    status,
                    emotional_load.as_deref(),
                    form.summary.trim(),
                    form.content.trim(),
                    is_locked,
                    requires_second_confirm,
                    exclude_from_ai,
                    form.review_cue.trim(),
                    next_order,
                    now,
                    now,
                    finalized_at.as_deref(),
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        let mut seen_tags = std::collections::HashSet::new();
        for (index, tag) in form
            .tags
            .iter()
            .map(|tag| tag.trim())
            .filter(|tag| !tag.is_empty())
            .filter(|tag| seen_tags.insert((*tag).to_string()))
            .enumerate()
        {
            conn.execute(
                "INSERT INTO legacy_item_tags (id, item_id, tag, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![format!("{}_tag_{}", id, index), id, tag, index as i32],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_item(conn: &Connection, id: &str, now: &str) -> Result<(), String> {
        conn.execute(
            "UPDATE legacy_items SET is_archived = 1, updated_at = ?2 WHERE id = ?1",
            params![id, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}
