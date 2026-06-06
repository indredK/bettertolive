#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use specta::Type;

// ---- 数据库行模型(部分类型仅用于 specta TypeScript 绑定生成) ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SystemDefinitionRow {
    pub id: String,
    pub name: String,
    pub summary: String,
    pub key_question: String,
    pub secondary_groups_json: String,
    pub sort_order: i32,
    pub is_enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SpaceDefinitionRow {
    pub id: String,
    pub name: String,
    pub note: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemRow {
    pub id: String,
    pub name: String,
    pub status: String,
    pub lane: Option<String>,
    pub lifecycle: String,
    pub depreciation: Option<String>,
    pub entry_price: Option<f64>,
    pub sweet_spot_price: Option<f64>,
    pub overpay_price: Option<f64>,
    pub note: String,
    // owned 来的可选字段
    pub quantity: Option<i32>,
    pub health_status: Option<String>,
    pub replacement_cue: Option<String>,
    // plan 来的可选字段
    pub reason: Option<String>,
    pub target_lifestyle: Option<String>,
    pub current_price: Option<f64>,
    pub buy_below_price: Option<f64>,
    pub keywords_json: Option<String>,
    pub sort_order: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemChildRow {
    pub id: String,
    pub item_id: String,
    pub name: String,
    pub status: Option<String>,
    pub lifecycle: Option<String>,
    pub depreciation: Option<String>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemChildChannelRow {
    pub id: String,
    pub item_child_id: String,
    pub channel: String,
    pub entry_price: Option<f64>,
    pub sweet_spot_price: Option<f64>,
    pub overpay_price: Option<f64>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemSystemTagRow {
    pub id: String,
    pub item_id: String,
    pub system_id: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemSpaceTagRow {
    pub id: String,
    pub item_id: String,
    pub space_id: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ItemChannelRow {
    pub id: String,
    pub item_id: String,
    pub channel: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone)]
pub struct ItemChildChannelWriteModel {
    pub id: String,
    pub channel: String,
    pub entry_price: Option<f64>,
    pub sweet_spot_price: Option<f64>,
    pub overpay_price: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct ItemChildWriteModel {
    pub id: String,
    pub name: String,
    pub status: Option<String>,
    pub lifecycle: Option<String>,
    pub depreciation: Option<String>,
    pub channel_prices: Vec<ItemChildChannelWriteModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StageTemplateRow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub focus: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StageItemRow {
    pub id: String,
    pub stage_template_id: String,
    pub item_id: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct StageItemTierRow {
    pub id: String,
    pub stage_item_id: String,
    pub tier: String, // "low" | "base" | "up"
    pub item_child_id: String,
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
