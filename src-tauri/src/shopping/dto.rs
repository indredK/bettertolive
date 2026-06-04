use serde::{Deserialize, Serialize};
use specta::Type;

// ---- Enums (as strings) ----

pub type ShoppingNeedLevel = String;
pub type ShoppingSystem = String;
pub type ShoppingStage = String;
pub type ShoppingLifecycle = String;
pub type ShoppingDepreciation = String;
pub type ShoppingSystemCluster = String;

// ---- DTOs ----

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
    pub cluster: ShoppingSystemCluster,
    pub summary: String,
    pub key_question: String,
    pub secondary_groups: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingItemBaseDto {
    pub system: ShoppingSystem,
    pub category: String,
    pub spaces: Vec<String>,
    pub stages: Vec<ShoppingStage>,
    pub necessity: ShoppingNeedLevel,
    pub lifecycle: ShoppingLifecycle,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depreciation: Option<ShoppingDepreciation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingOwnedItemDto {
    #[serde(flatten)]
    pub base: ShoppingItemBaseDto,
    pub id: String,
    pub name: String,
    pub quantity: i32,
    pub status: String,
    pub replacement_cue: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingPlanItemDto {
    #[serde(flatten)]
    pub base: ShoppingItemBaseDto,
    pub id: String,
    pub name: String,
    pub reason: String,
    pub target_lifestyle: String,
    pub current_price: f64,
    pub buy_below_price: f64,
    pub overpay_price: f64,
    pub note: String,
    pub tags: Vec<String>,
    pub keywords: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingPurchaseLaneDto {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub items: Vec<ShoppingPlanItemDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingStageChecklistSectionDto {
    pub system: ShoppingSystem,
    pub minimum: Vec<String>,
    pub essentials: Vec<String>,
    pub upgrades: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingStageChecklistDto {
    pub id: String,
    pub stage: ShoppingStage,
    pub title: String,
    pub description: String,
    pub focus: String,
    pub sections: Vec<ShoppingStageChecklistSectionDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingPriceReferenceDto {
    pub id: String,
    pub system: ShoppingSystem,
    pub category: String,
    pub lifecycle: ShoppingLifecycle,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depreciation: Option<ShoppingDepreciation>,
    pub entry_price: f64,
    pub sweet_spot_price: f64,
    pub overpay_price: f64,
    pub note: String,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShoppingModuleDto {
    pub system_definitions: Vec<ShoppingSystemDefinitionDto>,
    pub spotlights: Vec<ShoppingSpotlightDto>,
    pub owned_items: Vec<ShoppingOwnedItemDto>,
    pub purchase_lanes: Vec<ShoppingPurchaseLaneDto>,
    pub stage_checklists: Vec<ShoppingStageChecklistDto>,
    pub price_references: Vec<ShoppingPriceReferenceDto>,
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
