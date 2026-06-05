use serde::{Deserialize, Serialize};
use specta::Type;

// ---- Database row models ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SystemDefinitionRow {
    pub id: String,
    pub summary: String,
    pub key_question: String,
    pub secondary_groups_json: String,
    pub sort_order: i32,
    pub is_enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OwnedItemRow {
    pub id: String,
    pub name: String,
    pub system_id: String,
    pub category: String,
    // 注:DB 列 necessity 仍存在,Rust 端继续读出来但前端 DTO 已不再暴露
    pub necessity: String,
    pub lifecycle: String,
    pub depreciation: Option<String>,
    pub quantity: i32,
    pub status: String,
    pub replacement_cue: String,
    pub note: String,
    pub sort_order: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OwnedItemSpaceRow {
    pub id: String,
    pub owned_item_id: String,
    pub space_name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OwnedItemStageRow {
    pub id: String,
    pub owned_item_id: String,
    pub stage_name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PurchaseLaneRow {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub sort_order: i32,
    pub is_enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlanItemRow {
    pub id: String,
    pub lane_id: String,
    pub name: String,
    pub system_id: String,
    pub category: String,
    pub necessity: String,
    pub lifecycle: String,
    pub depreciation: Option<String>,
    pub reason: String,
    pub target_lifestyle: String,
    pub current_price: f64,
    pub buy_below_price: f64,
    pub overpay_price: f64,
    pub note: String,
    pub sort_order: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlanItemSpaceRow {
    pub id: String,
    pub plan_item_id: String,
    pub space_name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlanItemStageRow {
    pub id: String,
    pub plan_item_id: String,
    pub stage_name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlanItemTagRow {
    pub id: String,
    pub plan_item_id: String,
    pub tag_value: String,
    pub tag_type: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PageContentRow {
    pub id: String,
    pub content_type: String,
    pub title: Option<String>,
    pub stage: Option<String>,
    pub system_id: Option<String>,
    pub summary: Option<String>,
    pub reason: Option<String>,
    pub body_json: String,
    pub sort_order: i32,
    pub is_enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}
