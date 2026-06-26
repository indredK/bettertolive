use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ReflectionEntryDto {
    pub id: String,
    pub date: String,
    pub title: String,
    pub excerpt: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ReflectionDraftExampleDto {
    pub content: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ReflectionModuleDto {
    #[serde(default)]
    pub entries: Vec<ReflectionEntryDto>,
    pub draft_example: ReflectionDraftExampleDto,
}

impl ReflectionModuleDto {
    pub fn validate(&self) -> Result<(), String> {
        for entry in &self.entries {
            if entry.id.trim().is_empty() {
                return Err("reflection.entries[].id is required".to_string());
            }
            if entry.date.trim().is_empty() {
                return Err(format!("reflection entry {} is missing date", entry.id));
            }
            if entry.title.trim().is_empty() {
                return Err(format!("reflection entry {} is missing title", entry.id));
            }
            if entry.excerpt.trim().is_empty() {
                return Err(format!("reflection entry {} is missing excerpt", entry.id));
            }
            if entry.tags.iter().any(|tag| tag.trim().is_empty()) {
                return Err(format!("reflection entry {} contains empty tags", entry.id));
            }
        }

        if self
            .draft_example
            .tags
            .iter()
            .any(|tag| tag.trim().is_empty())
        {
            return Err("reflection.draftExample.tags contains empty tags".to_string());
        }

        Ok(())
    }
}
