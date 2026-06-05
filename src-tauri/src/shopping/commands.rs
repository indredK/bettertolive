use crate::shopping::db::chrono_now;
use crate::shopping::dto::{
    ShoppingModuleDto, ShoppingOwnedItemDto, ShoppingPlanItemDto, WorkspaceSnapshotDto,
};
use crate::shopping::models::{OwnedItemRow, PageContentRow, PlanItemRow};
use crate::shopping::repository::ShoppingRepository;
use rusqlite::params;
use std::sync::Mutex;
use tauri::State;

/// Application state holding the SQLite connection.
pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

// =====================
// Read-only aggregation commands
// =====================

/// Returns the full shopping module content aggregated from relational tables.
#[tauri::command]
#[specta::specta]
pub fn get_shopping(state: State<AppState>) -> Result<ShoppingModuleDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::get_shopping_module_aggregated(&conn)
}

/// Returns the workspace snapshot with all modules.
#[tauri::command]
pub fn get_workspace_snapshot(state: State<AppState>) -> Result<WorkspaceSnapshotDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let shopping = ShoppingRepository::get_shopping_module_aggregated(&conn)?;

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

// =====================
// Owned Item CRUD commands
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct OwnedItemFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    pub system: String,
    pub category: String,
    pub spaces: Vec<String>,
    pub stages: Vec<String>,
    pub necessity: String,
    pub lifecycle: String,
    pub depreciation: Option<String>,
    pub quantity: i32,
    pub status: String,
    #[serde(rename = "replacementCue")]
    pub replacement_cue: String,
    pub note: String,
}

#[tauri::command]
#[specta::specta]
pub fn list_owned_items(state: State<AppState>) -> Result<Vec<OwnedItemRow>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_owned_items(&conn)
}

#[tauri::command]
#[specta::specta]
pub fn create_owned_item(
    state: State<AppState>,
    form: OwnedItemFormDto,
) -> Result<ShoppingOwnedItemDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = ShoppingRepository::create_owned_item(
        &conn,
        &id,
        &form.name,
        &form.system,
        &form.category,
        &form.necessity,
        &form.lifecycle,
        form.depreciation.as_deref(),
        form.quantity,
        &form.status,
        &form.replacement_cue,
        &form.note,
        &form.spaces,
        &form.stages,
        &now,
    );

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    // Return the created item as DTO
    let item = ShoppingRepository::get_owned_item_by_id(&conn, &id)?
        .ok_or("Failed to retrieve created item")?;

    let spaces = ShoppingRepository::get_spaces_for_owned_item(&conn, &id)?;
    let stages = ShoppingRepository::get_stages_for_owned_item(&conn, &id)?;

    Ok(ShoppingOwnedItemDto {
        base: crate::shopping::dto::ShoppingItemBaseDto {
            system: item.system_id,
            category: item.category,
            spaces,
            stages,
            necessity: item.necessity,
            lifecycle: item.lifecycle,
            depreciation: item.depreciation,
        },
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        status: item.status,
        replacement_cue: item.replacement_cue,
        note: item.note,
    })
}

#[tauri::command]
#[specta::specta]
pub fn update_owned_item(
    state: State<AppState>,
    form: OwnedItemFormDto,
) -> Result<ShoppingOwnedItemDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.as_ref().ok_or("id is required for update")?.clone();
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = ShoppingRepository::update_owned_item(
        &conn,
        &id,
        &form.name,
        &form.system,
        &form.category,
        &form.necessity,
        &form.lifecycle,
        form.depreciation.as_deref(),
        form.quantity,
        &form.status,
        &form.replacement_cue,
        &form.note,
        &form.spaces,
        &form.stages,
        &now,
    );

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    let item = ShoppingRepository::get_owned_item_by_id(&conn, &id)?
        .ok_or("Failed to retrieve updated item")?;

    let spaces = ShoppingRepository::get_spaces_for_owned_item(&conn, &id)?;
    let stages = ShoppingRepository::get_stages_for_owned_item(&conn, &id)?;

    Ok(ShoppingOwnedItemDto {
        base: crate::shopping::dto::ShoppingItemBaseDto {
            system: item.system_id,
            category: item.category,
            spaces,
            stages,
            necessity: item.necessity,
            lifecycle: item.lifecycle,
            depreciation: item.depreciation,
        },
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        status: item.status,
        replacement_cue: item.replacement_cue,
        note: item.note,
    })
}

#[tauri::command]
#[specta::specta]
pub fn delete_owned_item(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::delete_owned_item(&conn, &id)
}

// =====================
// Plan Item CRUD commands
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlanItemFormDto {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(rename = "laneId")]
    pub lane_id: String,
    pub name: String,
    pub system: String,
    pub category: String,
    pub spaces: Vec<String>,
    pub stages: Vec<String>,
    pub necessity: String,
    pub lifecycle: String,
    pub depreciation: Option<String>,
    pub reason: String,
    #[serde(rename = "targetLifestyle")]
    pub target_lifestyle: String,
    #[serde(rename = "currentPrice")]
    pub current_price: f64,
    #[serde(rename = "buyBelowPrice")]
    pub buy_below_price: f64,
    #[serde(rename = "overpayPrice")]
    pub overpay_price: f64,
    pub note: String,
    pub tags: Vec<String>,
    pub keywords: Vec<String>,
}

#[tauri::command]
#[specta::specta]
pub fn list_plan_items(state: State<AppState>) -> Result<Vec<PlanItemRow>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_plan_items(&conn)
}

#[tauri::command]
#[specta::specta]
pub fn create_plan_item(
    state: State<AppState>,
    form: PlanItemFormDto,
) -> Result<ShoppingPlanItemDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = ShoppingRepository::create_plan_item(
        &conn,
        &id,
        &form.lane_id,
        &form.name,
        &form.system,
        &form.category,
        &form.necessity,
        &form.lifecycle,
        form.depreciation.as_deref(),
        &form.reason,
        &form.target_lifestyle,
        form.current_price,
        form.buy_below_price,
        form.overpay_price,
        &form.note,
        &form.spaces,
        &form.stages,
        &form.tags,
        &form.keywords,
        &now,
    );

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    let item = ShoppingRepository::get_plan_item_by_id(&conn, &id)?
        .ok_or("Failed to retrieve created item")?;

    let spaces = ShoppingRepository::get_spaces_for_plan_item(&conn, &id)?;
    let stages = ShoppingRepository::get_stages_for_plan_item(&conn, &id)?;
    let tags = ShoppingRepository::get_tags_for_plan_item(&conn, &id, "tag")?;
    let keywords = ShoppingRepository::get_tags_for_plan_item(&conn, &id, "keyword")?;

    Ok(ShoppingPlanItemDto {
        base: crate::shopping::dto::ShoppingItemBaseDto {
            system: item.system_id,
            category: item.category,
            spaces,
            stages,
            necessity: item.necessity,
            lifecycle: item.lifecycle,
            depreciation: item.depreciation,
        },
        id: item.id,
        name: item.name,
        reason: item.reason,
        target_lifestyle: item.target_lifestyle,
        current_price: item.current_price,
        buy_below_price: item.buy_below_price,
        overpay_price: item.overpay_price,
        note: item.note,
        tags,
        keywords,
    })
}

#[tauri::command]
#[specta::specta]
pub fn update_plan_item(
    state: State<AppState>,
    form: PlanItemFormDto,
) -> Result<ShoppingPlanItemDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.as_ref().ok_or("id is required for update")?.clone();
    let now = chrono_now();

    conn.execute("BEGIN TRANSACTION", params![])
        .map_err(|e| e.to_string())?;

    let result = ShoppingRepository::update_plan_item(
        &conn,
        &id,
        &form.lane_id,
        &form.name,
        &form.system,
        &form.category,
        &form.necessity,
        &form.lifecycle,
        form.depreciation.as_deref(),
        &form.reason,
        &form.target_lifestyle,
        form.current_price,
        form.buy_below_price,
        form.overpay_price,
        &form.note,
        &form.spaces,
        &form.stages,
        &form.tags,
        &form.keywords,
        &now,
    );

    if let Err(err) = result {
        conn.execute("ROLLBACK", params![])
            .map_err(|e| e.to_string())?;
        return Err(err);
    }

    conn.execute("COMMIT", params![])
        .map_err(|e| e.to_string())?;

    let item = ShoppingRepository::get_plan_item_by_id(&conn, &id)?
        .ok_or("Failed to retrieve updated item")?;

    let spaces = ShoppingRepository::get_spaces_for_plan_item(&conn, &id)?;
    let stages = ShoppingRepository::get_stages_for_plan_item(&conn, &id)?;
    let tags = ShoppingRepository::get_tags_for_plan_item(&conn, &id, "tag")?;
    let keywords = ShoppingRepository::get_tags_for_plan_item(&conn, &id, "keyword")?;

    Ok(ShoppingPlanItemDto {
        base: crate::shopping::dto::ShoppingItemBaseDto {
            system: item.system_id,
            category: item.category,
            spaces,
            stages,
            necessity: item.necessity,
            lifecycle: item.lifecycle,
            depreciation: item.depreciation,
        },
        id: item.id,
        name: item.name,
        reason: item.reason,
        target_lifestyle: item.target_lifestyle,
        current_price: item.current_price,
        buy_below_price: item.buy_below_price,
        overpay_price: item.overpay_price,
        note: item.note,
        tags,
        keywords,
    })
}

#[tauri::command]
#[specta::specta]
pub fn delete_plan_item(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::delete_plan_item(&conn, &id)
}

// =====================
// Page Content CRUD commands
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PageContentFormDto {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(rename = "contentType")]
    pub content_type: String,
    pub title: Option<String>,
    pub stage: Option<String>,
    pub system: Option<String>,
    pub summary: Option<String>,
    pub reason: Option<String>,
    pub body: String,
}

#[tauri::command]
#[specta::specta]
pub fn list_shopping_page_contents(
    state: State<AppState>,
    content_type: Option<String>,
) -> Result<Vec<PageContentRow>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_page_contents(&conn, content_type.as_deref())
}

#[tauri::command]
#[specta::specta]
pub fn create_shopping_page_content(
    state: State<AppState>,
    form: PageContentFormDto,
) -> Result<PageContentRow, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();

    ShoppingRepository::create_page_content(
        &conn,
        &id,
        &form.content_type,
        form.title.as_deref(),
        form.stage.as_deref(),
        form.system.as_deref(),
        form.summary.as_deref(),
        form.reason.as_deref(),
        &form.body,
        &now,
    )?;

    ShoppingRepository::get_page_content_by_id(&conn, &id)?
        .ok_or("Failed to retrieve created page content".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn update_shopping_page_content(
    state: State<AppState>,
    form: PageContentFormDto,
) -> Result<PageContentRow, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.as_ref().ok_or("id is required for update")?.clone();
    let now = chrono_now();

    ShoppingRepository::update_page_content(
        &conn,
        &id,
        &form.content_type,
        form.title.as_deref(),
        form.stage.as_deref(),
        form.system.as_deref(),
        form.summary.as_deref(),
        form.reason.as_deref(),
        &form.body,
        &now,
    )?;

    ShoppingRepository::get_page_content_by_id(&conn, &id)?
        .ok_or("Failed to retrieve updated page content".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn delete_shopping_page_content(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::delete_page_content(&conn, &id)
}

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SystemDefinitionFormDto {
    pub id: String,
    pub cluster: String,
    pub summary: String,
    pub key_question: String,
    pub secondary_groups: Vec<String>,
}

#[tauri::command]
#[specta::specta]
pub fn create_system_definition(
    state: State<AppState>,
    form: SystemDefinitionFormDto,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::create_system_definition(
        &conn,
        &form.id,
        &form.cluster,
        &form.summary,
        &form.key_question,
        &form.secondary_groups,
        &now,
    )
}

#[tauri::command]
#[specta::specta]
pub fn update_system_definition(
    state: State<AppState>,
    form: SystemDefinitionFormDto,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::update_system_definition(
        &conn,
        &form.id,
        &form.cluster,
        &form.summary,
        &form.key_question,
        &form.secondary_groups,
        &now,
    )
}

#[tauri::command]
#[specta::specta]
pub fn delete_system_definition(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::delete_system_definition(&conn, &id)
}

// =====================
// Reorder commands
// =====================

#[tauri::command]
#[specta::specta]
pub fn reorder_system_definitions(
    state: State<AppState>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::reorder_system_definitions(&conn, &ordered_ids, &now)
}

#[tauri::command]
#[specta::specta]
pub fn reorder_shopping_page_contents(
    state: State<AppState>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::reorder_page_contents(&conn, &ordered_ids, &now)
}
