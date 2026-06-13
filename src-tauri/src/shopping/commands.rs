#![allow(clippy::too_many_arguments, clippy::type_complexity)]

use crate::shopping::db::{chrono_now, write_tx};
use crate::shopping::dto::{
    ShoppingItemDto, ShoppingModuleDto, ShoppingSpaceDefinitionDto, ShoppingStageTemplateDto,
    WorkspaceSnapshotDto,
};
use crate::shopping::models::{ItemChildChannelWriteModel, ItemChildWriteModel, PageContentRow};
use crate::shopping::repository::ShoppingRepository;
use crate::{beliefs::commands::BeliefsState, beliefs::dto::BeliefsModuleDto};
use crate::{
    emotion::commands::{get_emotion, EmotionState},
    events::commands::{get_events, EventsState},
    finance::commands::{get_finance, FinanceState},
    future::commands::{get_future, FutureState},
    growth::commands::{get_growth, GrowthState},
    memory::commands::{get_memory, MemoryState},
    nutrition::commands::{get_nutrition, NutritionState},
    overview::commands::{get_overview, OverviewState},
    principles::commands::{get_principles, PrinciplesState},
    reflection::commands::{get_reflection, ReflectionState},
    relationships::commands::{get_relationships, RelationshipsState},
    socioeconomics::commands::{get_socioeconomics, SocioeconomicsState},
};
use crate::{legacy::dto::LegacyModuleDto, legacy::repository::LegacyRepository};
use std::sync::Mutex;
use tauri::State;

/// 应用状态:持有 SQLite 连接。
pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

// =====================
// 聚合查询
// =====================

#[tauri::command]
#[specta::specta]
pub fn get_shopping(state: State<AppState>) -> Result<ShoppingModuleDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::get_shopping_module_aggregated(&conn)
}

#[tauri::command]
pub fn get_workspace_snapshot(
    state: State<AppState>,
    beliefs_state: State<BeliefsState>,
    emotion_state: State<EmotionState>,
    events_state: State<EventsState>,
    finance_state: State<FinanceState>,
    future_state: State<FutureState>,
    growth_state: State<GrowthState>,
    memory_state: State<MemoryState>,
    nutrition_state: State<NutritionState>,
    overview_state: State<OverviewState>,
    principles_state: State<PrinciplesState>,
    reflection_state: State<ReflectionState>,
    relationships_state: State<RelationshipsState>,
    socioeconomics_state: State<SocioeconomicsState>,
) -> Result<WorkspaceSnapshotDto, String> {
    let overview = get_overview(overview_state)?;
    let reflection = get_reflection(reflection_state)?;
    let events = get_events(events_state)?;
    let finance = get_finance(finance_state)?;
    let nutrition = get_nutrition(nutrition_state)?;
    let emotion = get_emotion(emotion_state)?;
    let beliefs = crate::beliefs::commands::get_beliefs(beliefs_state)?;
    let principles = get_principles(principles_state)?;
    let relationships = get_relationships(relationships_state)?;
    let growth = get_growth(growth_state)?;
    let memory = get_memory(memory_state)?;
    let socioeconomics = get_socioeconomics(socioeconomics_state)?;
    let future = get_future(future_state)?;
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let shopping = ShoppingRepository::get_shopping_module_aggregated(&conn)?;
    let legacy = LegacyRepository::get_legacy_module(&conn)?;

    Ok(WorkspaceSnapshotDto {
        overview: Some(overview),
        reflection: Some(reflection),
        events: Some(events),
        finance: Some(finance),
        shopping,
        nutrition: Some(nutrition),
        emotion: Some(emotion),
        beliefs: Some(
            serde_json::to_value::<BeliefsModuleDto>(beliefs).map_err(|e| e.to_string())?,
        ),
        principles: Some(principles),
        relationships: Some(relationships),
        growth: Some(growth),
        memory: Some(memory),
        legacy: Some(serde_json::to_value::<LegacyModuleDto>(legacy).map_err(|e| e.to_string())?),
        socioeconomics: Some(socioeconomics),
        future: Some(future),
    })
}

// =====================
// 系统定义 CRUD
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SystemDefinitionFormDto {
    pub id: String,
    pub name: String,
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
        &form.name,
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
        &form.name,
        &form.summary,
        &form.key_question,
        &form.secondary_groups,
        &now,
    )
}

#[tauri::command]
#[specta::specta]
pub fn delete_system_definition(state: State<AppState>, id: String) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    write_tx(&mut conn, |tx| {
        ShoppingRepository::delete_system_definition(tx, &id)
    })
}

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
pub fn assign_system_definition_items(
    state: State<AppState>,
    system_id: String,
    item_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::replace_system_definition_items(&conn, &system_id, &item_ids)
}

// =====================
// 空间定义 CRUD
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SpaceDefinitionFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub note: String,
}

#[tauri::command]
#[specta::specta]
pub fn list_shopping_space_definitions(
    state: State<AppState>,
) -> Result<Vec<ShoppingSpaceDefinitionDto>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_space_definitions_dto(&conn)
}

#[tauri::command]
#[specta::specta]
pub fn create_shopping_space_definition(
    state: State<AppState>,
    form: SpaceDefinitionFormDto,
) -> Result<ShoppingSpaceDefinitionDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();
    ShoppingRepository::create_space_definition(&conn, &id, &form.name, &form.note, &now)
}

#[tauri::command]
#[specta::specta]
pub fn update_shopping_space_definition(
    state: State<AppState>,
    form: SpaceDefinitionFormDto,
) -> Result<ShoppingSpaceDefinitionDto, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.ok_or("id is required for update")?;
    let now = chrono_now();
    ShoppingRepository::update_space_definition(&conn, &id, &form.name, &form.note, &now)
}

#[tauri::command]
#[specta::specta]
pub fn delete_shopping_space_definition(state: State<AppState>, id: String) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    write_tx(&mut conn, |tx| {
        ShoppingRepository::delete_space_definition(tx, &id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn reorder_space_definitions(
    state: State<AppState>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::reorder_space_definitions(&conn, &ordered_ids, &now)
}

#[tauri::command]
#[specta::specta]
pub fn assign_space_definition_items(
    state: State<AppState>,
    space_id: String,
    item_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::replace_space_definition_items(&conn, &space_id, &item_ids)
}

// =====================
// 物品 CRUD(统一,替代旧 owned/plan)
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItemChildChannelFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub channel: String,
    #[serde(default)]
    pub entry_price: Option<f64>,
    #[serde(default)]
    pub sweet_spot_price: Option<f64>,
    #[serde(default)]
    pub overpay_price: Option<f64>,
}

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItemChildFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub lifecycle: Option<String>,
    #[serde(default)]
    pub depreciation: Option<String>,
    #[serde(default)]
    pub channel_prices: Vec<ItemChildChannelFormDto>,
}

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItemFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    pub children: Vec<ItemChildFormDto>,
    pub system_tags: Vec<String>,
    pub space_tags: Vec<String>,
    #[serde(default)]
    pub note: String,
}

#[tauri::command]
#[specta::specta]
pub fn list_shopping_items(state: State<AppState>) -> Result<Vec<ShoppingItemDto>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_items_dto(&conn)
}

fn item_form_to_args(form: &ItemFormDto, item_id: &str) -> Vec<ItemChildWriteModel> {
    form.children
        .iter()
        .enumerate()
        .map(|(i, c)| {
            let child_id =
                c.id.clone()
                    .unwrap_or_else(|| format!("{}_child_{}", item_id, i));

            let channel_prices = c
                .channel_prices
                .iter()
                .enumerate()
                .map(|(channel_index, channel)| ItemChildChannelWriteModel {
                    id: channel
                        .id
                        .clone()
                        .unwrap_or_else(|| format!("{}_channel_{}", child_id, channel_index)),
                    channel: channel.channel.clone(),
                    entry_price: channel.entry_price,
                    sweet_spot_price: channel.sweet_spot_price,
                    overpay_price: channel.overpay_price,
                })
                .collect();

            ItemChildWriteModel {
                id: child_id,
                name: c.name.clone(),
                status: c.status.clone(),
                lifecycle: c.lifecycle.clone(),
                depreciation: c.depreciation.clone(),
                channel_prices,
            }
        })
        .collect()
}

#[tauri::command]
#[specta::specta]
pub fn create_shopping_item(
    state: State<AppState>,
    form: ItemFormDto,
) -> Result<ShoppingItemDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();
    let children = item_form_to_args(&form, &id);

    write_tx(&mut conn, |tx| {
        ShoppingRepository::upsert_item(
            tx,
            &id,
            &form.name,
            &form.note,
            &children,
            &form.system_tags,
            &form.space_tags,
            false,
            &now,
        )
    })?;

    ShoppingRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load created item".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn update_shopping_item(
    state: State<AppState>,
    form: ItemFormDto,
) -> Result<ShoppingItemDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.clone().ok_or("id is required for update")?;
    let now = chrono_now();
    let children = item_form_to_args(&form, &id);

    write_tx(&mut conn, |tx| {
        ShoppingRepository::upsert_item(
            tx,
            &id,
            &form.name,
            &form.note,
            &children,
            &form.system_tags,
            &form.space_tags,
            true,
            &now,
        )
    })?;

    ShoppingRepository::get_item_by_id(&conn, &id)?.ok_or("Failed to load updated item".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn delete_shopping_item(state: State<AppState>, id: String) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    write_tx(&mut conn, |tx| ShoppingRepository::delete_item(tx, &id))
}

// =====================
// 阶段模板 CRUD
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct StageItemTiersFormDto {
    pub low: Vec<String>,
    pub base: Vec<String>,
    pub up: Vec<String>,
}

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct StageItemFormDto {
    pub item_id: String,
    pub tiers: StageItemTiersFormDto,
}

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct StageTemplateFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub focus: String,
    #[serde(default)]
    pub system_dimension_ids: Vec<String>,
    #[serde(default)]
    pub space_dimension_ids: Vec<String>,
    pub items: Vec<StageItemFormDto>,
}

#[tauri::command]
#[specta::specta]
pub fn list_shopping_stage_templates(
    state: State<AppState>,
) -> Result<Vec<ShoppingStageTemplateDto>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    ShoppingRepository::list_stage_templates_dto(&conn)
}

fn stage_form_to_args(
    form: &StageTemplateFormDto,
) -> Vec<(String, Vec<String>, Vec<String>, Vec<String>)> {
    form.items
        .iter()
        .map(|si| {
            (
                si.item_id.clone(),
                si.tiers.low.clone(),
                si.tiers.base.clone(),
                si.tiers.up.clone(),
            )
        })
        .collect()
}

#[tauri::command]
#[specta::specta]
pub fn create_shopping_stage_template(
    state: State<AppState>,
    form: StageTemplateFormDto,
) -> Result<ShoppingStageTemplateDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono_now();
    let items = stage_form_to_args(&form);

    write_tx(&mut conn, |tx| {
        ShoppingRepository::upsert_stage_template(
            tx,
            &id,
            &form.name,
            &form.description,
            &form.focus,
            &form.system_dimension_ids,
            &form.space_dimension_ids,
            &items,
            false,
            &now,
        )
    })?;

    ShoppingRepository::get_stage_template_by_id(&conn, &id)?
        .ok_or("Failed to load created stage template".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn update_shopping_stage_template(
    state: State<AppState>,
    form: StageTemplateFormDto,
) -> Result<ShoppingStageTemplateDto, String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = form.id.clone().ok_or("id is required for update")?;
    let now = chrono_now();
    let items = stage_form_to_args(&form);

    write_tx(&mut conn, |tx| {
        ShoppingRepository::upsert_stage_template(
            tx,
            &id,
            &form.name,
            &form.description,
            &form.focus,
            &form.system_dimension_ids,
            &form.space_dimension_ids,
            &items,
            true,
            &now,
        )
    })?;

    ShoppingRepository::get_stage_template_by_id(&conn, &id)?
        .ok_or("Failed to load updated stage template".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn delete_shopping_stage_template(state: State<AppState>, id: String) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    write_tx(&mut conn, |tx| {
        ShoppingRepository::delete_stage_template(tx, &id)
    })
}

#[tauri::command]
#[specta::specta]
pub fn reorder_stage_templates(
    state: State<AppState>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = chrono_now();
    ShoppingRepository::reorder_stage_templates(&conn, &ordered_ids, &now)
}

// =====================
// 页面内容 CRUD(spotlight/boundary/lifestyle)
// =====================

#[derive(Debug, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PageContentFormDto {
    #[serde(default)]
    pub id: Option<String>,
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
