use crate::legacy::dto::{LegacyItemDto, LegacyItemFormDto, LegacyModuleDto};
use crate::legacy::repository::LegacyRepository;
use crate::shopping::commands::AppState;
use crate::shopping::db::{chrono_now, write_tx};
use tauri::State;

#[tauri::command]
#[specta::specta]
pub fn get_legacy(state: State<AppState>) -> Result<LegacyModuleDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    LegacyRepository::get_legacy_module(&conn)
}

#[tauri::command]
#[specta::specta]
pub fn list_legacy_items(state: State<AppState>) -> Result<Vec<LegacyItemDto>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    LegacyRepository::list_items(&conn)
}

#[tauri::command]
#[specta::specta]
pub fn create_legacy_item(
    state: State<AppState>,
    form: LegacyItemFormDto,
) -> Result<LegacyItemDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();

    write_tx(&mut conn, |tx| {
        LegacyRepository::upsert_item(tx, &id, &form, false, &now)
    })?;

    LegacyRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load created legacy item".into())
}

#[tauri::command]
#[specta::specta]
pub fn update_legacy_item(
    state: State<AppState>,
    form: LegacyItemFormDto,
) -> Result<LegacyItemDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.clone().ok_or("id is required for update")?;
    let now = chrono_now();

    write_tx(&mut conn, |tx| {
        LegacyRepository::upsert_item(tx, &id, &form, true, &now)
    })?;

    LegacyRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load updated legacy item".into())
}

#[tauri::command]
#[specta::specta]
pub fn delete_legacy_item(state: State<AppState>, id: String) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();

    write_tx(&mut conn, |tx| LegacyRepository::delete_item(tx, &id, &now))
}

#[tauri::command]
#[specta::specta]
pub fn import_legacy(state: State<AppState>, data: LegacyModuleDto) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();

    write_tx(&mut conn, |tx| {
        // Clear all existing legacy data
        tx.execute("DELETE FROM legacy_item_tags", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM legacy_items", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM legacy_trust_boundaries", [])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM legacy_review_prompts", [])
            .map_err(|e| e.to_string())?;

        // Insert items
        for (index, item) in data.items.iter().enumerate() {
            let sort_order = index as i32;
            let finalized_at = item.finalized_at.as_deref();

            tx.execute(
                "INSERT INTO legacy_items (
                    id, title, category, recipient, recipient_name, related_relationship_id,
                    urgency, visibility, delivery_condition, status, emotional_load,
                    summary, content, is_locked, requires_second_confirm, exclude_from_ai,
                    review_cue, sort_order, is_archived, created_at, updated_at, finalized_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, 0, ?19, ?20, ?21)",
                rusqlite::params![
                    item.id, item.title, item.category, item.recipient,
                    item.recipient_name, item.related_relationship_id,
                    item.urgency, item.visibility, item.delivery_condition,
                    item.status, item.emotional_load, item.summary, item.content,
                    item.is_locked, item.requires_second_confirm, item.exclude_from_ai,
                    item.review_cue, sort_order, item.created_at, now, finalized_at,
                ],
            ).map_err(|e| e.to_string())?;

            // Insert tags for each item
            for (tag_index, tag) in item.tags.iter().enumerate() {
                tx.execute(
                    "INSERT INTO legacy_item_tags (id, item_id, tag, sort_order)
                     VALUES (?1, ?2, ?3, ?4)",
                    rusqlite::params![
                        format!("{}_tag_{}", item.id, tag_index),
                        item.id,
                        tag,
                        tag_index as i32,
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        // Insert trust boundaries
        for (index, boundary) in data.trust_boundaries.iter().enumerate() {
            tx.execute(
                "INSERT INTO legacy_trust_boundaries (id, title, detail, sort_order)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET title = excluded.title, detail = excluded.detail, sort_order = excluded.sort_order",
                rusqlite::params![boundary.id, boundary.title, boundary.detail, index as i32],
            ).map_err(|e| e.to_string())?;
        }

        // Insert review prompts
        for (index, prompt) in data.review_prompts.iter().enumerate() {
            tx.execute(
                "INSERT INTO legacy_review_prompts (id, prompt, sort_order)
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(id) DO UPDATE SET prompt = excluded.prompt, sort_order = excluded.sort_order",
                rusqlite::params![format!("prompt_{}", index), prompt, index as i32],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    })
}
