use crate::shopping::commands::AppState;
use tauri::{Manager, State};

const JSON_FILES: &[&str] = &[
    "nutrition.json",
    "beliefs.json",
    "emotion.json",
    "events.json",
    "finance.json",
    "overview.json",
    "reflection.json",
    "growth.json",
    "memory.json",
    "journey.json",
    "principles.json",
    "relationships.json",
    "socioeconomics.json",
    "future.json",
    "worldhistory.json",
];

const SHOPPING_TABLES: &[&str] = &[
    // 子表先删（多数有 ON DELETE CASCADE，但显式删除幂等且清晰）
    "shopping_items",
    "shopping_item_children",
    "shopping_item_child_channels",
    "shopping_item_systems",
    "shopping_item_spaces",
    "shopping_stage_templates",
    "shopping_stage_items",
    "shopping_stage_item_tiers",
    "shopping_stage_template_system_dimensions",
    "shopping_stage_template_space_dimensions",
    "shopping_page_content",
    // 定义类表无外键到 items，不会被级联删除，必须显式清理才能让 seed 重新生效
    "shopping_system_definitions",
    "shopping_space_definitions",
    // attribute_definitions 被 item_children / child_channels 引用（非级联），
    // 放在最后确保引用方已被清空
    "shopping_attribute_definitions",
];

const LEGACY_TABLES: &[&str] = &[
    "legacy_items",
    "legacy_item_tags",
    "legacy_trust_boundaries",
    "legacy_review_prompts",
];

#[tauri::command]
pub fn reset_to_initial_data(
    app_handle: tauri::AppHandle,
    app_state: State<AppState>,
) -> Result<(), String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {}", e))?;

    // 1. Delete all JSON module files
    for filename in JSON_FILES {
        let path = app_data_dir.join(filename);
        if path.exists() {
            std::fs::remove_file(&path)
                .map_err(|e| format!("failed to delete {}: {}", filename, e))?;
        }
    }

    // 2. Clear shopping SQLite tables and re-seed
    {
        let conn = app_state
            .db
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        for table in SHOPPING_TABLES {
            conn.execute(&format!("DELETE FROM {}", table), [])
                .map_err(|e| format!("failed to clear {}: {}", table, e))?;
        }

        crate::shopping::db::seed_new_tables(&conn)
            .map_err(|e| format!("failed to re-seed shopping: {}", e))?;
    }

    // 3. Clear legacy SQLite tables and re-seed
    {
        let conn = app_state
            .db
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        for table in LEGACY_TABLES {
            conn.execute(&format!("DELETE FROM {}", table), [])
                .map_err(|e| format!("failed to clear {}: {}", table, e))?;
        }

        crate::legacy::db::seed_tables(&conn)
            .map_err(|e| format!("failed to re-seed legacy: {}", e))?;
    }

    Ok(())
}
