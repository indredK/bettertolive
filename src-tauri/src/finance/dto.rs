use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum TransactionDirectionDto {
    #[serde(rename = "income")]
    Income,
    #[serde(rename = "expense")]
    Expense,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum FinanceCategoryDto {
    #[serde(rename = "food", alias = "餐饮")]
    Food,
    #[serde(rename = "housing", alias = "居住")]
    Housing,
    #[serde(rename = "transport", alias = "交通")]
    Transport,
    #[serde(rename = "shopping", alias = "购物")]
    Shopping,
    #[serde(rename = "learning", alias = "学习成长")]
    Learning,
    #[serde(rename = "health", alias = "健康")]
    Health,
    #[serde(rename = "social", alias = "社交")]
    Social,
    #[serde(rename = "entertainment", alias = "娱乐")]
    Entertainment,
    #[serde(rename = "income", alias = "收入")]
    Income,
    #[serde(rename = "savings", alias = "储蓄")]
    Savings,
    #[serde(rename = "other", alias = "其他")]
    Other,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum FinanceLifeSystemDto {
    #[serde(rename = "basic_life", alias = "基本生活")]
    BasicLife,
    #[serde(rename = "health", alias = "身体健康")]
    Health,
    #[serde(rename = "relationships", alias = "关系社交")]
    Relationships,
    #[serde(rename = "growth", alias = "成长学习")]
    Growth,
    #[serde(rename = "housing", alias = "居住环境")]
    Housing,
    #[serde(rename = "safety", alias = "自由安全")]
    Safety,
    #[serde(rename = "recovery", alias = "娱乐恢复")]
    Recovery,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum FinanceNecessityDto {
    #[serde(rename = "essential", alias = "生存必需")]
    Essential,
    #[serde(rename = "maintenance", alias = "稳定维护")]
    Maintenance,
    #[serde(rename = "upgrade", alias = "体验改善")]
    Upgrade,
    #[serde(rename = "long_term_investment", alias = "长期投资")]
    LongTermInvestment,
    #[serde(rename = "impulse_review", alias = "冲动/待复盘")]
    ImpulseReview,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum FinanceReviewStatusDto {
    #[serde(rename = "confirmed", alias = "已确认")]
    Confirmed,
    #[serde(rename = "needs_review", alias = "待复盘")]
    NeedsReview,
    #[serde(rename = "can_optimize", alias = "可优化")]
    CanOptimize,
    #[serde(rename = "worth_keeping", alias = "值得保留")]
    WorthKeeping,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum FinanceLinkedModuleDto {
    #[serde(rename = "manual", alias = "手动录入")]
    Manual,
    #[serde(rename = "shopping", alias = "购物")]
    Shopping,
    #[serde(rename = "nutrition", alias = "饮食")]
    Nutrition,
    #[serde(rename = "events", alias = "记事")]
    Events,
    #[serde(rename = "reflection", alias = "反思")]
    Reflection,
    #[serde(rename = "future", alias = "未来")]
    Future,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TransactionEntryDto {
    pub id: String,
    pub date: String,
    pub label: String,
    pub category: FinanceCategoryDto,
    pub amount: f64,
    pub direction: TransactionDirectionDto,
    pub note: String,
    #[serde(default)]
    pub account: Option<String>,
    #[serde(default)]
    pub life_system: Option<FinanceLifeSystemDto>,
    #[serde(default)]
    pub necessity: Option<FinanceNecessityDto>,
    #[serde(default)]
    pub review_status: Option<FinanceReviewStatusDto>,
    #[serde(default)]
    pub linked_module: Option<FinanceLinkedModuleDto>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FinanceMonthlyTargetDto {
    pub id: String,
    pub month: String,
    #[serde(default)]
    pub income_target: Option<f64>,
    #[serde(default)]
    pub expense_limit: Option<f64>,
    #[serde(default)]
    pub saving_target: Option<f64>,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FinanceCategoryRuleDto {
    pub id: String,
    pub category: FinanceCategoryDto,
    #[serde(default)]
    pub monthly_limit: Option<f64>,
    pub intent: String,
    #[serde(default)]
    pub review_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FinanceModuleDto {
    #[serde(default)]
    pub entries: Vec<TransactionEntryDto>,
    #[serde(default)]
    pub monthly_targets: Vec<FinanceMonthlyTargetDto>,
    #[serde(default)]
    pub category_rules: Vec<FinanceCategoryRuleDto>,
    #[serde(default)]
    pub review_prompts: Vec<String>,
}

impl FinanceModuleDto {
    /// Fix up legacy data: convert negative amounts to positive and flip direction.
    pub fn normalize(&mut self) {
        for entry in &mut self.entries {
            if entry.amount < 0.0 {
                entry.amount = -entry.amount;
                entry.direction = match entry.direction {
                    TransactionDirectionDto::Income => TransactionDirectionDto::Expense,
                    TransactionDirectionDto::Expense => TransactionDirectionDto::Income,
                };
            }
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        for entry in &self.entries {
            if entry.id.trim().is_empty() {
                return Err("finance.entries[].id is required".to_string());
            }
            if entry.date.trim().is_empty() {
                return Err(format!("finance entry {} is missing date", entry.id));
            }
            if entry.label.trim().is_empty() {
                return Err(format!("finance entry {} is missing label", entry.id));
            }
            if entry.amount < 0.0 {
                return Err(format!(
                    "finance entry {} amount must be positive",
                    entry.id
                ));
            }
            if entry.tags.iter().any(|tag| tag.trim().is_empty()) {
                return Err(format!("finance entry {} contains empty tags", entry.id));
            }
        }

        for target in &self.monthly_targets {
            if target.id.trim().is_empty() {
                return Err("finance.monthlyTargets[].id is required".to_string());
            }
            if target.month.trim().is_empty() {
                return Err(format!(
                    "finance monthly target {} is missing month",
                    target.id
                ));
            }
        }

        for rule in &self.category_rules {
            if rule.id.trim().is_empty() {
                return Err("finance.categoryRules[].id is required".to_string());
            }
            if rule.intent.trim().is_empty() {
                return Err(format!(
                    "finance category rule {} is missing intent",
                    rule.id
                ));
            }
        }

        if self
            .review_prompts
            .iter()
            .any(|prompt| prompt.trim().is_empty())
        {
            return Err("finance.reviewPrompts contains empty prompts".to_string());
        }

        Ok(())
    }
}
