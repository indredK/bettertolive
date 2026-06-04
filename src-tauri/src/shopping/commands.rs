use crate::shopping::dto::{ShoppingModuleDto, WorkspaceSnapshotDto};
use crate::shopping::repository::ShoppingRepository;
use std::sync::Mutex;
use tauri::State;

/// Application state holding the SQLite connection.
pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

/// GET /api/bettertolive/shopping equivalent
/// Returns the full shopping module content as a DTO.
#[tauri::command]
#[specta::specta]
pub fn get_shopping(state: State<AppState>) -> Result<ShoppingModuleDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::get_shopping_module(&conn)
}

/// GET /api/bettertolive/workspace equivalent
/// Returns the workspace snapshot with all modules.
/// For now, only shopping is populated; other modules return null.
#[tauri::command]
pub fn get_workspace_snapshot(state: State<AppState>) -> Result<WorkspaceSnapshotDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let shopping = ShoppingRepository::get_shopping_module(&conn)?;

    Ok(WorkspaceSnapshotDto {
        overview: None,
        reflection: None,
        events: None,
        finance: None,
        shopping,
        nutrition: None,
        emotion: None,
        beliefs: None,
        principles: None,
        relationships: None,
        growth: None,
        memory: None,
        legacy: None,
        socioeconomics: None,
        future: None,
    })
}
