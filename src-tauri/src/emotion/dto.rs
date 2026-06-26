use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionStateDto {
    #[serde(rename = "平静")]
    Calm,
    #[serde(rename = "回稳")]
    Stabilizing,
    #[serde(rename = "低压焦虑")]
    LowPressureAnxiety,
    #[serde(rename = "易怒")]
    Irritable,
    #[serde(rename = "麻木")]
    Numb,
    #[serde(rename = "空")]
    Empty,
    #[serde(rename = "委屈")]
    Hurt,
    #[serde(rename = "难过")]
    Sad,
    #[serde(rename = "高压后空掉")]
    PostStressEmpty,
    #[serde(rename = "松弛")]
    Relaxed,
    #[serde(rename = "期待")]
    Anticipating,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionTagDto {
    #[serde(rename = "难过")]
    Sad,
    #[serde(rename = "焦虑")]
    Anxious,
    #[serde(rename = "空")]
    Empty,
    #[serde(rename = "平静")]
    Calm,
    #[serde(rename = "委屈")]
    Hurt,
    #[serde(rename = "愤怒")]
    Angry,
    #[serde(rename = "松弛")]
    Relaxed,
    #[serde(rename = "期待")]
    Anticipating,
    #[serde(rename = "羞愧")]
    Shame,
    #[serde(rename = "恐惧")]
    Fear,
    #[serde(rename = "孤独")]
    Lonely,
    #[serde(rename = "兴奋")]
    Excited,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionImpulseDto {
    #[serde(rename = "逃避")]
    Avoid,
    #[serde(rename = "倾诉")]
    Talk,
    #[serde(rename = "睡觉")]
    Sleep,
    #[serde(rename = "吃东西")]
    Eat,
    #[serde(rename = "出门")]
    GoOut,
    #[serde(rename = "沉默")]
    Silence,
    #[serde(rename = "运动")]
    Exercise,
    #[serde(rename = "刷手机")]
    ScrollPhone,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionTriggerCategoryDto {
    #[serde(rename = "工作")]
    Work,
    #[serde(rename = "家庭")]
    Family,
    #[serde(rename = "亲密关系")]
    IntimateRelationship,
    #[serde(rename = "金钱")]
    Money,
    #[serde(rename = "睡眠")]
    Sleep,
    #[serde(rename = "社交")]
    Social,
    #[serde(rename = "自我否定")]
    SelfCriticism,
    #[serde(rename = "环境")]
    Environment,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionSupportToolKindDto {
    #[serde(rename = "有效")]
    Helpful,
    #[serde(rename = "无效")]
    Unhelpful,
    #[serde(rename = "极简三步")]
    MinimalSteps,
    #[serde(rename = "可联系")]
    Reachable,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionTimelineTrendDto {
    #[serde(rename = "持续恶化")]
    Worsening,
    #[serde(rename = "逐渐恢复")]
    Recovering,
    #[serde(rename = "起伏波动")]
    Fluctuating,
    #[serde(rename = "平稳")]
    Stable,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionLifestyleFactorDto {
    #[serde(rename = "睡眠")]
    Sleep,
    #[serde(rename = "饮食")]
    Nutrition,
    #[serde(rename = "运动")]
    Exercise,
    #[serde(rename = "经期")]
    MenstrualCycle,
    #[serde(rename = "饮酒")]
    Alcohol,
    #[serde(rename = "屏幕时长")]
    ScreenTime,
    #[serde(rename = "通勤")]
    Commute,
    #[serde(rename = "独处")]
    Solitude,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq, Eq)]
pub enum EmotionLifestyleDirectionDto {
    #[serde(rename = "正相关")]
    Positive,
    #[serde(rename = "负相关")]
    Negative,
    #[serde(rename = "混合")]
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionCheckInDto {
    pub id: String,
    pub date: String,
    pub summary: String,
    pub state: EmotionStateDto,
    pub intensity: String,
    pub body_signal: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub emotion_tags: Vec<EmotionTagDto>,
    #[serde(default)]
    pub trigger_event: Option<String>,
    #[serde(default)]
    pub impulse: Option<EmotionImpulseDto>,
    #[serde(default)]
    pub need_right_now: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionTrendPointDto {
    pub id: String,
    pub label: String,
    pub score: i32,
    pub note: String,
    #[serde(default)]
    pub primary_state: Option<EmotionStateDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionTriggerGroupDto {
    pub id: String,
    pub title: String,
    pub summary: String,
    #[serde(default)]
    pub cues: Vec<String>,
    #[serde(default)]
    pub category: Option<EmotionTriggerCategoryDto>,
    #[serde(default)]
    pub recent_examples: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionSupportToolDto {
    pub id: String,
    pub title: String,
    pub description: String,
    pub when: String,
    #[serde(default)]
    pub kind: Option<EmotionSupportToolKindDto>,
    #[serde(default)]
    pub contact_script: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionTimelineSegmentDto {
    pub id: String,
    pub range: String,
    pub trend: EmotionTimelineTrendDto,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionLoopPatternDto {
    pub id: String,
    pub title: String,
    pub description: String,
    pub frequency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionLifestyleLinkDto {
    pub id: String,
    pub factor: EmotionLifestyleFactorDto,
    pub observation: String,
    pub direction: EmotionLifestyleDirectionDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionEnvironmentCueDto {
    pub id: String,
    pub context: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionRelationshipCueDto {
    pub id: String,
    pub who: String,
    pub pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionRecoveryNoteDto {
    pub id: String,
    pub date: String,
    pub what: String,
    pub effect: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionTagCountDto {
    pub tag: EmotionTagDto,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionOverviewSummaryDto {
    pub window_label: String,
    pub average_score: f64,
    #[serde(default)]
    pub top_emotion_tags: Vec<EmotionTagCountDto>,
    pub best_window: String,
    pub worst_window: String,
    pub conclusion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionModuleDto {
    #[serde(default)]
    pub check_ins: Vec<EmotionCheckInDto>,
    #[serde(default)]
    pub trend: Vec<EmotionTrendPointDto>,
    #[serde(default)]
    pub triggers: Vec<EmotionTriggerGroupDto>,
    #[serde(default)]
    pub tools: Vec<EmotionSupportToolDto>,
    pub overview: EmotionOverviewSummaryDto,
    #[serde(default)]
    pub timeline_segments: Vec<EmotionTimelineSegmentDto>,
    #[serde(default)]
    pub loop_patterns: Vec<EmotionLoopPatternDto>,
    #[serde(default)]
    pub lifestyle_links: Vec<EmotionLifestyleLinkDto>,
    #[serde(default)]
    pub environment_cues: Vec<EmotionEnvironmentCueDto>,
    #[serde(default)]
    pub relationship_cues: Vec<EmotionRelationshipCueDto>,
    #[serde(default)]
    pub recovery_notes: Vec<EmotionRecoveryNoteDto>,
    #[serde(default)]
    pub ineffective_actions: Vec<String>,
    #[serde(default)]
    pub minimal_recovery_steps: Vec<String>,
}

impl EmotionModuleDto {
    pub fn validate(&self) -> Result<(), String> {
        for entry in &self.check_ins {
            if entry.id.trim().is_empty() {
                return Err("emotion.checkIns[].id is required".to_string());
            }
            if entry.date.trim().is_empty() || entry.summary.trim().is_empty() {
                return Err(format!("emotion check-in {} is incomplete", entry.id));
            }
            if entry.intensity.trim().is_empty() || entry.body_signal.trim().is_empty() {
                return Err(format!("emotion check-in {} is incomplete", entry.id));
            }
            if entry.tags.iter().any(|tag| tag.trim().is_empty()) {
                return Err(format!("emotion check-in {} contains empty tags", entry.id));
            }
        }

        for point in &self.trend {
            if point.id.trim().is_empty() || point.label.trim().is_empty() {
                return Err("emotion.trend[] contains incomplete points".to_string());
            }
            if !(0..=10).contains(&point.score) {
                return Err(format!(
                    "emotion trend point {} has invalid score",
                    point.id
                ));
            }
        }

        if !(0.0..=10.0).contains(&self.overview.average_score) {
            return Err("emotion.overview.averageScore must stay between 0 and 10".to_string());
        }

        for tool in &self.tools {
            if tool.id.trim().is_empty()
                || tool.title.trim().is_empty()
                || tool.when.trim().is_empty()
            {
                return Err("emotion.tools[] contains incomplete tools".to_string());
            }
        }

        for line in &self.ineffective_actions {
            if line.trim().is_empty() {
                return Err("emotion.ineffectiveActions contains empty items".to_string());
            }
        }

        for line in &self.minimal_recovery_steps {
            if line.trim().is_empty() {
                return Err("emotion.minimalRecoverySteps contains empty items".to_string());
            }
        }

        Ok(())
    }
}
