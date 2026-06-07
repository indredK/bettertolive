mod nutrition;
mod shopping;

use nutrition::commands::{get_nutrition, save_nutrition, NutritionState};
use shopping::commands::{
    assign_space_definition_items, assign_system_definition_items, create_shopping_item,
    create_shopping_page_content, create_shopping_space_definition, create_shopping_stage_template,
    create_system_definition, delete_shopping_item, delete_shopping_page_content,
    delete_shopping_space_definition, delete_shopping_stage_template, delete_system_definition,
    get_shopping, get_workspace_snapshot, list_shopping_items, list_shopping_page_contents,
    list_shopping_space_definitions, list_shopping_stage_templates, reorder_shopping_page_contents,
    reorder_space_definitions, reorder_stage_templates, reorder_system_definitions,
    update_shopping_item, update_shopping_page_content, update_shopping_space_definition,
    update_shopping_stage_template, update_system_definition, AppState,
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
            app.manage(NutritionState {
                data_path: app_data_dir.join("nutrition.json"),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_nutrition,
            save_nutrition,
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
