use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyItemDto {
    pub id: String,
    pub title: String,
    pub category: String,
    pub recipient: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipient_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub related_relationship_id: Option<String>,
    pub urgency: String,
    pub visibility: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delivery_condition: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emotional_load: Option<String>,
    pub summary: String,
    pub content: String,
    pub content_preview: String,
    pub is_locked: bool,
    pub requires_second_confirm: bool,
    pub exclude_from_ai: bool,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finalized_at: Option<String>,
    pub review_cue: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyTrustBoundaryDto {
    pub id: String,
    pub title: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct LegacyModuleDto {
    #[serde(default)]
    pub items: Vec<LegacyItemDto>,
    #[serde(default)]
    pub trust_boundaries: Vec<LegacyTrustBoundaryDto>,
    #[serde(default)]
    pub review_prompts: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LegacyItemFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub title: String,
    pub category: String,
    pub recipient: String,
    #[serde(default)]
    pub recipient_name: Option<String>,
    #[serde(default)]
    pub related_relationship_id: Option<String>,
    pub urgency: String,
    pub visibility: String,
    #[serde(default)]
    pub delivery_condition: Option<String>,
    pub status: String,
    #[serde(default)]
    pub emotional_load: Option<String>,
    pub summary: String,
    pub content: String,
    #[serde(default)]
    pub is_locked: bool,
    #[serde(default)]
    pub requires_second_confirm: bool,
    #[serde(default)]
    pub exclude_from_ai: bool,
    #[serde(default)]
    pub review_cue: String,
    #[serde(default)]
    pub tags: Vec<String>,
}
