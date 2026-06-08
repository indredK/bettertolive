use serde::{Deserialize, Serialize};
use specta::Type;

pub type BeliefDomain = String;
pub type BeliefLayer = String;
pub type BeliefStability = String;
pub type BeliefSource = String;
pub type BeliefImpact = String;
pub type BeliefCbtLayer = String;
pub type CognitiveDistortion = String;
pub type DefenseMechanism = String;
pub type BeliefRelationType = String;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefRevisionDto {
    pub id: String,
    pub date: String,
    pub summary: String,
    pub changed_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefRelationDto {
    pub id: String,
    pub r#type: BeliefRelationType,
    pub from_id: String,
    pub to_id: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefEntryDto {
    pub id: String,
    pub title: String,
    pub statement: String,
    pub description: String,
    pub domain: BeliefDomain,
    pub layer: BeliefLayer,
    pub stability: BeliefStability,
    pub source: BeliefSource,
    pub impact: BeliefImpact,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub secondary_domains: Vec<BeliefDomain>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cbt_layer: Option<BeliefCbtLayer>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub cognitive_distortions: Vec<CognitiveDistortion>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub defense_mechanism: Option<DefenseMechanism>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachment_note: Option<String>,
    #[serde(default)]
    pub revision_history: Vec<BeliefRevisionDto>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefCardDto {
    pub id: String,
    pub label: String,
    pub summary: String,
    pub note: String,
    pub keywords: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefsModuleDto {
    pub cards: Vec<BeliefCardDto>,
    pub questions: Vec<String>,
    pub entries: Vec<BeliefEntryDto>,
    pub relations: Vec<BeliefRelationDto>,
    pub attachment_reflection: String,
}

#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BeliefEntryFormDto {
    #[serde(default)]
    pub id: Option<String>,
    pub title: String,
    pub statement: String,
    #[serde(default)]
    pub description: String,
    pub domain: BeliefDomain,
    pub layer: BeliefLayer,
    pub stability: BeliefStability,
    pub source: BeliefSource,
    pub impact: BeliefImpact,
    #[serde(default)]
    pub secondary_domains: Vec<BeliefDomain>,
    #[serde(default)]
    pub cbt_layer: Option<BeliefCbtLayer>,
    #[serde(default)]
    pub cognitive_distortions: Vec<CognitiveDistortion>,
    #[serde(default)]
    pub defense_mechanism: Option<DefenseMechanism>,
    #[serde(default)]
    pub attachment_note: Option<String>,
    #[serde(default)]
    pub revision_history: Vec<BeliefRevisionDto>,
    #[serde(default)]
    pub tags: Vec<String>,
}
