use crate::finance::dto::FinanceModuleDto;
use crate::json_store::{atomic_write_json, read_json_file};
use std::path::PathBuf;
use tauri::State;

/// 记账模块第一阶段后端状态。
///
/// 当前先用 app data 下的 finance.json 做最小持久化；
/// 后续如果账目导入、筛选或聚合需求变复杂，再迁移到 SQLite 表。
pub struct FinanceState {
    pub data_path: PathBuf,
}

fn seed_finance() -> Result<FinanceModuleDto, String> {
    serde_json::from_str(include_str!("initial.json")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_finance(state: State<FinanceState>) -> Result<FinanceModuleDto, String> {
    if !state.data_path.exists() {
        return seed_finance();
    }

    read_json_file(&state.data_path)
}

#[tauri::command]
pub fn save_finance(
    state: State<FinanceState>,
    mut finance: FinanceModuleDto,
) -> Result<(), String> {
    finance.normalize();
    finance.validate()?;
    atomic_write_json(&state.data_path, &finance)
}

#[cfg(test)]
mod tests {
    use crate::finance::dto::FinanceModuleDto;

    #[test]
    fn legacy_finance_values_round_trip_to_codes() {
        let finance: FinanceModuleDto = serde_json::from_value(serde_json::json!({
            "entries": [
                {
                    "id": "finance-entry-1",
                    "date": "2026-06-20",
                    "label": "Lunch",
                    "category": "餐饮",
                    "amount": 24,
                    "direction": "expense",
                    "note": "note",
                    "lifeSystem": "基本生活",
                    "necessity": "生存必需",
                    "reviewStatus": "待复盘",
                    "linkedModule": "手动录入",
                    "tags": ["daily"]
                }
            ],
            "monthlyTargets": [],
            "categoryRules": [],
            "reviewPrompts": []
        }))
        .unwrap();

        finance.validate().unwrap();

        let persisted = serde_json::to_value(finance).unwrap();
        assert_eq!(persisted["entries"][0]["category"], "food");
        assert_eq!(persisted["entries"][0]["lifeSystem"], "basic_life");
        assert_eq!(persisted["entries"][0]["necessity"], "essential");
        assert_eq!(persisted["entries"][0]["reviewStatus"], "needs_review");
        assert_eq!(persisted["entries"][0]["linkedModule"], "manual");
    }

    #[test]
    fn rejects_negative_finance_amount() {
        let finance: FinanceModuleDto = serde_json::from_value(serde_json::json!({
            "entries": [
                {
                    "id": "finance-entry-1",
                    "date": "2026-06-20",
                    "label": "Lunch",
                    "category": "food",
                    "amount": -5,
                    "direction": "expense",
                    "note": "note",
                    "tags": []
                }
            ],
            "monthlyTargets": [],
            "categoryRules": [],
            "reviewPrompts": []
        }))
        .unwrap();

        let error = finance.validate().unwrap_err();
        assert!(error.contains("amount must be positive"));
    }

    #[test]
    fn allows_zero_finance_amount() {
        let finance: FinanceModuleDto = serde_json::from_value(serde_json::json!({
            "entries": [
                {
                    "id": "finance-entry-1",
                    "date": "2026-06-20",
                    "label": "Lunch",
                    "category": "food",
                    "amount": 0,
                    "direction": "expense",
                    "note": "note",
                    "tags": []
                }
            ],
            "monthlyTargets": [],
            "categoryRules": [],
            "reviewPrompts": []
        }))
        .unwrap();

        finance.validate().unwrap();
    }
}
