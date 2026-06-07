use serde::{Deserialize, Serialize};
use specta::Type;

// ---- 类型别名(全部为字符串,枚举值在前端定义) ----

pub type ShoppingSystem = String;
pub type ShoppingLifecycle = String;
pub type ShoppingDepreciation = String;
pub type ShoppingStatus = String; // "Owned" | "Wanted"

// ---- 基础展示 DTO(保留) ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingSpotlightDto {
    pub id: String,
    pub title: String,
    pub stage: String,
    pub summary: String,
    pub reason: String,
    pub attention: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingSystemDefinitionDto {
    pub id: ShoppingSystem,
    pub name: String,
    pub summary: String,
    pub key_question: String,
    pub secondary_groups: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingSpaceDefinitionDto {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub note: String,
}

// ---- 物品(统一,跨 Tab 共享) ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingItemChildChannelDto {
    pub id: String,
    pub channel: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entry_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sweet_spot_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overpay_price: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingItemChildDto {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<ShoppingStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lifecycle: Option<ShoppingLifecycle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depreciation: Option<ShoppingDepreciation>,
    #[serde(default)]
    pub channel_prices: Vec<ShoppingItemChildChannelDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingItemDto {
    pub id: String,
    pub name: String,
    pub children: Vec<ShoppingItemChildDto>,

    // 分组标签(必填多选)
    pub system_tags: Vec<ShoppingSystem>,
    pub space_tags: Vec<String>,

    // 通用备注
    pub note: String,
}

// ---- 阶段模板 ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingStageItemTiersDto {
    pub low: Vec<String>,
    pub base: Vec<String>,
    pub up: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingStageItemDto {
    pub item_id: String,
    pub tiers: ShoppingStageItemTiersDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingStageTemplateDto {
    pub id: String,
    pub name: String,
    pub description: String,
    pub focus: String,
    pub system_dimension_ids: Vec<String>,
    pub space_dimension_ids: Vec<String>,
    pub items: Vec<ShoppingStageItemDto>,
}

// ---- 文档辅助(保留) ----

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingBoundaryEntryDto {
    pub id: String,
    pub item: String,
    pub system: ShoppingSystem,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingLifestyleCollectionDto {
    pub id: String,
    pub title: String,
    pub description: String,
    pub items: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingOverviewStagePulseDto {
    pub id: String,
    pub name: String,
    pub item_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingOverviewDimensionPulseDto {
    pub id: String,
    pub name: String,
    pub item_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingOverviewDto {
    pub total_items: i32,
    pub owned_items: i32,
    pub wanted_items: i32,
    pub total_systems: i32,
    pub total_spaces: i32,
    pub total_stages: i32,
    pub total_children: i32,
    pub total_spotlights: i32,
    pub total_boundary_entries: i32,
    pub total_lifestyle_collections: i32,
    pub top_stage_pulses: Vec<ShoppingOverviewStagePulseDto>,
    pub top_system_pulses: Vec<ShoppingOverviewDimensionPulseDto>,
    pub top_space_pulses: Vec<ShoppingOverviewDimensionPulseDto>,
}

// ---- 模块聚合 DTO ----

#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingModuleDto {
    pub overview: ShoppingOverviewDto,
    pub system_definitions: Vec<ShoppingSystemDefinitionDto>,
    pub space_definitions: Vec<ShoppingSpaceDefinitionDto>,
    pub spotlights: Vec<ShoppingSpotlightDto>,
    pub items: Vec<ShoppingItemDto>,
    pub stage_templates: Vec<ShoppingStageTemplateDto>,
    pub boundary_entries: Vec<ShoppingBoundaryEntryDto>,
    pub lifestyle_collections: Vec<ShoppingLifestyleCollectionDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSnapshotDto {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overview: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reflection: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub events: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finance: Option<serde_json::Value>,
    pub shopping: ShoppingModuleDto,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nutrition: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emotion: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub beliefs: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub principles: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub relationships: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub growth: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub socioeconomics: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub future: Option<serde_json::Value>,
}
