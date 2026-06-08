use crate::legacy::dto::{LegacyItemDto, LegacyItemFormDto, LegacyModuleDto};
use crate::legacy::repository::LegacyRepository;
use crate::shopping::commands::AppState;
use crate::shopping::db::chrono_now;
use rusqlite::params;
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
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = LegacyRepository::upsert_item(&conn, &id, &form, false, &now);

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    LegacyRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load created legacy item".into())
}

#[tauri::command]
#[specta::specta]
pub fn update_legacy_item(
    state: State<AppState>,
    form: LegacyItemFormDto,
) -> Result<LegacyItemDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.clone().ok_or("id is required for update")?;
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = LegacyRepository::upsert_item(&conn, &id, &form, true, &now);

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    LegacyRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load updated legacy item".into())
}

#[tauri::command]
#[specta::specta]
pub fn delete_legacy_item(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = LegacyRepository::delete_item(&conn, &id, &now);

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map(|_| ())
        .map_err(|e| e.to_string())
}
