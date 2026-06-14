mod beliefs;
mod emotion;
mod events;
mod finance;
mod future;
mod growth;
mod legacy;
mod memory;
mod nutrition;
mod overview;
mod principles;
mod reflection;
mod relationships;
mod shopping;
mod socioeconomics;
mod worldhistory;

use beliefs::commands::{
    create_belief_entry, delete_belief_entry, get_beliefs, update_belief_entry, BeliefsState,
};
use emotion::commands::{get_emotion, save_emotion, EmotionState};
use events::commands::{get_events, save_events, EventsState};
use finance::commands::{get_finance, save_finance, FinanceState};
use future::commands::{get_future, save_future, FutureState};
use growth::commands::{get_growth, save_growth, GrowthState};
use legacy::commands::{
    create_legacy_item, delete_legacy_item, get_legacy, list_legacy_items, update_legacy_item,
};
use memory::commands::{get_memory, save_memory, MemoryState};
use nutrition::commands::{get_nutrition, save_nutrition, NutritionState};
use overview::commands::{get_overview, OverviewState};
use principles::commands::{get_principles, save_principles, PrinciplesState};
use reflection::commands::{get_reflection, save_reflection, ReflectionState};
use relationships::commands::{get_relationships, save_relationships, RelationshipsState};
use shopping::commands::{
    assign_space_definition_items, assign_system_definition_items,
    count_items_using_shopping_attribute, create_shopping_attribute_definition,
    create_shopping_item, create_shopping_page_content, create_shopping_space_definition,
    create_shopping_stage_template, create_system_definition, delete_shopping_item,
    delete_shopping_page_content, delete_shopping_space_definition, delete_shopping_stage_template,
    delete_system_definition, disable_shopping_attribute_definition,
    enable_shopping_attribute_definition, get_shopping, get_workspace_snapshot,
    list_shopping_attribute_definitions, list_shopping_attribute_definitions_for_management,
    list_shopping_items, list_shopping_page_contents, list_shopping_space_definitions,
    list_shopping_stage_templates, reorder_shopping_attribute_definitions,
    reorder_shopping_page_contents, reorder_space_definitions, reorder_stage_templates,
    reorder_system_definitions, update_shopping_attribute_definition, update_shopping_item,
    update_shopping_page_content, update_shopping_space_definition, update_shopping_stage_template,
    update_system_definition, AppState,
};
use socioeconomics::commands::{get_socioeconomics, save_socioeconomics, SocioeconomicsState};
use specta_typescript::Typescript;
use std::sync::Mutex;
use tauri::Manager;
use worldhistory::commands::{get_world_history, save_world_history, WorldHistoryState};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
#[specta::specta]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn specta_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        greet,
        get_beliefs,
        create_belief_entry,
        update_belief_entry,
        delete_belief_entry,
        get_legacy,
        list_legacy_items,
        create_legacy_item,
        update_legacy_item,
        delete_legacy_item,
        get_shopping,
        list_shopping_items,
        create_shopping_item,
        update_shopping_item,
        delete_shopping_item,
        list_shopping_stage_templates,
        create_shopping_stage_template,
        update_shopping_stage_template,
        delete_shopping_stage_template,
        reorder_stage_templates,
        list_shopping_space_definitions,
        list_shopping_attribute_definitions,
        list_shopping_attribute_definitions_for_management,
        create_shopping_attribute_definition,
        update_shopping_attribute_definition,
        disable_shopping_attribute_definition,
        enable_shopping_attribute_definition,
        reorder_shopping_attribute_definitions,
        create_shopping_space_definition,
        update_shopping_space_definition,
        delete_shopping_space_definition,
        reorder_space_definitions,
        list_shopping_page_contents,
        create_shopping_page_content,
        update_shopping_page_content,
        delete_shopping_page_content,
        create_system_definition,
        update_system_definition,
        delete_system_definition,
        reorder_system_definitions,
        assign_system_definition_items,
        assign_space_definition_items,
        reorder_shopping_page_contents,
        count_items_using_shopping_attribute
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = specta_builder();

    #[cfg(debug_assertions)]
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("failed to resolve app data dir: {}", e))?;

            std::fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("failed to create app data dir: {}", e))?;

            let db_path = app_data_dir.join("bettertolive.db");

            let conn = shopping::db::initialize_database(&db_path)
                .map_err(|e| format!("failed to initialize database: {}", e))?;

            app.manage(AppState {
                db: Mutex::new(conn),
            });
            app.manage(NutritionState {
                data_path: app_data_dir.join("nutrition.json"),
            });
            app.manage(BeliefsState {
                data_path: app_data_dir.join("beliefs.json"),
            });
            app.manage(EmotionState {
                data_path: app_data_dir.join("emotion.json"),
            });
            app.manage(EventsState {
                data_path: app_data_dir.join("events.json"),
            });
            app.manage(FinanceState {
                data_path: app_data_dir.join("finance.json"),
            });
            app.manage(OverviewState {
                data_path: app_data_dir.join("overview.json"),
            });
            app.manage(ReflectionState {
                data_path: app_data_dir.join("reflection.json"),
            });
            app.manage(GrowthState {
                data_path: app_data_dir.join("growth.json"),
            });
            app.manage(MemoryState {
                data_path: app_data_dir.join("memory.json"),
            });
            app.manage(PrinciplesState {
                data_path: app_data_dir.join("principles.json"),
            });
            app.manage(RelationshipsState {
                data_path: app_data_dir.join("relationships.json"),
            });
            app.manage(SocioeconomicsState {
                data_path: app_data_dir.join("socioeconomics.json"),
            });
            app.manage(FutureState {
                data_path: app_data_dir.join("future.json"),
            });
            app.manage(WorldHistoryState {
                data_path: app_data_dir.join("worldhistory.json"),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_overview,
            get_reflection,
            save_reflection,
            get_emotion,
            save_emotion,
            get_events,
            save_events,
            get_finance,
            save_finance,
            get_growth,
            save_growth,
            get_memory,
            save_memory,
            get_legacy,
            list_legacy_items,
            create_legacy_item,
            update_legacy_item,
            delete_legacy_item,
            get_nutrition,
            save_nutrition,
            get_beliefs,
            create_belief_entry,
            update_belief_entry,
            delete_belief_entry,
            get_principles,
            save_principles,
            get_relationships,
            save_relationships,
            get_socioeconomics,
            save_socioeconomics,
            get_future,
            save_future,
            get_world_history,
            save_world_history,
            get_shopping,
            get_workspace_snapshot,
            list_shopping_items,
            create_shopping_item,
            update_shopping_item,
            delete_shopping_item,
            list_shopping_stage_templates,
            create_shopping_stage_template,
            update_shopping_stage_template,
            delete_shopping_stage_template,
            reorder_stage_templates,
            list_shopping_space_definitions,
            list_shopping_attribute_definitions,
            list_shopping_attribute_definitions_for_management,
            create_shopping_attribute_definition,
            update_shopping_attribute_definition,
            disable_shopping_attribute_definition,
            enable_shopping_attribute_definition,
            reorder_shopping_attribute_definitions,
            create_shopping_space_definition,
            update_shopping_space_definition,
            delete_shopping_space_definition,
            reorder_space_definitions,
            list_shopping_page_contents,
            create_shopping_page_content,
            update_shopping_page_content,
            delete_shopping_page_content,
            create_system_definition,
            update_system_definition,
            delete_system_definition,
            reorder_system_definitions,
            assign_system_definition_items,
            assign_space_definition_items,
            reorder_shopping_page_contents,
            count_items_using_shopping_attribute
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::specta_builder;
    use specta_typescript::Typescript;

    #[test]
    fn export_bindings() {
        specta_builder()
            .export(Typescript::default(), "../src/bindings.ts")
            .expect("failed to export typescript bindings");
    }
}
