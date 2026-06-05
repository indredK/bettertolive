mod shopping;

use shopping::commands::{
    create_owned_item, create_plan_item, create_shopping_page_content, create_system_definition,
    delete_owned_item, delete_plan_item, delete_shopping_page_content, get_shopping,
    get_workspace_snapshot, list_owned_items, list_plan_items, list_purchase_lanes,
    list_shopping_page_contents, reorder_shopping_page_contents, reorder_system_definitions,
    update_owned_item, update_plan_item, update_shopping_page_content, update_system_definition,
    AppState,
};
use specta_typescript::Typescript;
use std::sync::Mutex;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
#[specta::specta]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn specta_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        greet,
        get_shopping,
        list_owned_items,
        create_owned_item,
        update_owned_item,
        delete_owned_item,
        list_plan_items,
        create_plan_item,
        update_plan_item,
        delete_plan_item,
        list_shopping_page_contents,
        create_shopping_page_content,
        update_shopping_page_content,
        delete_shopping_page_content,
        create_system_definition,
        update_system_definition,
        list_purchase_lanes,
        reorder_system_definitions,
        reorder_shopping_page_contents
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
            // Resolve the app data directory for the database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");

            std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");

            let db_path = app_data_dir.join("bettertolive.db");

            let conn =
                shopping::db::initialize_database(&db_path).expect("failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_shopping,
            get_workspace_snapshot,
            list_owned_items,
            create_owned_item,
            update_owned_item,
            delete_owned_item,
            list_plan_items,
            create_plan_item,
            update_plan_item,
            delete_plan_item,
            list_shopping_page_contents,
            create_shopping_page_content,
            update_shopping_page_content,
            delete_shopping_page_content,
            create_system_definition,
            update_system_definition,
            list_purchase_lanes,
            reorder_system_definitions,
            reorder_shopping_page_contents
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
