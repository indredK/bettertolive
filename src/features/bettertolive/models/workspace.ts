export type AppView =
  | "overview"
  | "reflection"
  | "events"
  | "finance"
  | "shopping"
  | "nutrition"
  | "emotion"
  | "crisis"
  | "beliefs"
  | "principles"
  | "relationships"
  | "journey"
  | "legacy"
  | "socioeconomics"
  | "future"

export type ReflectionEntry = {
  id: string
  date: string
  title: string
  excerpt: string
  tags: string[]
}

export type ReflectionDraftExample = {
  content: string
  tags: string[]
}

export type EventEntry = {
  id: string
  date: string
  title: string
  excerpt: string
  theme: string
}

export type TransactionDirection = "income" | "expense"

export type TransactionEntry = {
  id: string
  date: string
  label: string
  category: string
  amount: number
  direction: TransactionDirection
  note: string
}

export type ShoppingSpotlight = {
  id: string
  title: string
  stage: string
  summary: string
  reason: string
  attention: string[]
}

export type ShoppingNeedLevel = "最低配置" | "必要" | "改善体验" | "提升幸福感"

export type ShoppingSystem =
  | "睡眠"
  | "饮食"
  | "清洁"
  | "收纳"
  | "照明"
  | "环境"
  | "电力网络"
  | "工作学习"
  | "应急健康"
  | "个人护理"
  | "穿着"
  | "家具陈设"
  | "出行"
  | "娱乐爱好"

export type ShoppingStage = "搬家最低配" | "租房" | "长期居住" | "自有住房" | "自建房"

export type ShoppingLifecycle = "消耗品" | "耐用品" | "工具" | "情感物"

export type ShoppingDepreciation = "极快折旧" | "较快折旧" | "中等折旧" | "慢折旧" | "不折旧或升值"

export type ShoppingSystemCluster = "基础系统" | "家居与生活方式"

export type ShoppingSystemDefinition = {
  id: ShoppingSystem
  cluster: ShoppingSystemCluster
  summary: string
  keyQuestion: string
  secondaryGroups: string[]
}

export type ShoppingItemBase = {
  system: ShoppingSystem
  category: string
  spaces: string[]
  stages: ShoppingStage[]
  necessity: ShoppingNeedLevel
  lifecycle: ShoppingLifecycle
  depreciation?: ShoppingDepreciation
}

export type ShoppingOwnedItem = ShoppingItemBase & {
  id: string
  name: string
  quantity: number
  status: string
  replacementCue: string
  note: string
}

export type ShoppingPlanItem = ShoppingItemBase & {
  id: string
  name: string
  reason: string
  targetLifestyle: string
  currentPrice: number
  buyBelowPrice: number
  overpayPrice: number
  note: string
  tags: string[]
}

export type ShoppingPurchaseLane = {
  id: string
  title: string
  subtitle: string
  items: ShoppingPlanItem[]
}

export type ShoppingStageChecklistSection = {
  system: ShoppingSystem
  minimum: string[]
  essentials: string[]
  upgrades: string[]
}

export type ShoppingStageChecklist = {
  id: string
  stage: ShoppingStage
  title: string
  description: string
  focus: string
  sections: ShoppingStageChecklistSection[]
}

export type ShoppingPriceReference = {
  id: string
  system: ShoppingSystem
  category: string
  lifecycle: ShoppingLifecycle
  depreciation?: ShoppingDepreciation
  entryPrice: number
  sweetSpotPrice: number
  overpayPrice: number
  note: string
}

export type ShoppingBoundaryEntry = {
  id: string
  item: string
  system: ShoppingSystem
  reason: string
}

export type ShoppingLifestyleCollection = {
  id: string
  title: string
  description: string
  items: string[]
}

export type RecentRecordKind = "反思" | "记事" | "支出" | "收入" | "蓝图" | "情绪" | "记忆" | "托付"

export type RecentRecord = {
  id: string
  kind: RecentRecordKind
  title: string
  description: string
  date: string
}

export type FutureMilestone = {
  horizon: string
  summary: string
  steps: string[]
}

export type FutureBlueprint = {
  identity: string
  lifestyle: string
  values: string[]
  milestones: FutureMilestone[]
  experiments: string[]
}

export type BeliefCard = {
  id: string
  label: string
  summary: string
  note: string
  keywords: string[]
}

export type BeliefProfile = {
  cards: BeliefCard[]
  questions: string[]
}

export type PrincipleDomain = "关系" | "工作" | "金钱" | "健康" | "时间" | "诚信"

export type PrincipleType = "边界" | "标准" | "底线"

export type PrincipleStrength = "不可退让" | "强烈偏好" | "参考指引"

export type PrincipleSource = "受伤后确立" | "观察他人" | "主动推导" | "家庭继承"

export type PrincipleStatus = "生效中" | "正在测试" | "已修订" | "已放弃"

export type PrincipleCost = "高代价" | "中等代价" | "低代价" | "零代价"

export type PrincipleRelationType = "支撑" | "冲突"

export type PrincipleRevision = {
  id: string
  date: string
  summary: string
  changedFields: Array<"内容" | "强度" | "状态">
}

export type PrincipleRelation = {
  id: string
  type: PrincipleRelationType
  fromId: string
  toId: string
  note: string
}

export type PrincipleEntry = {
  id: string
  title: string
  statement: string
  description: string
  domain: PrincipleDomain
  type: PrincipleType
  strength: PrincipleStrength
  source: PrincipleSource
  status: PrincipleStatus
  cost: PrincipleCost
  boundary: string
  protectedValue: string
  decisionCue: string
  revisionHistory: PrincipleRevision[]
  tags: string[]
}

export type PrincipleProfile = {
  entries: PrincipleEntry[]
  boundaries: string[]
  relations: PrincipleRelation[]
  decisionPrompts: string[]
}

export type RelationshipType = "家人" | "伴侣" | "朋友" | "同事" | "过去重要的人" | "导师/榜样"

export type RelationshipDepth = "亲密" | "亲近" | "熟人" | "疏远" | "断联"

export type RelationshipStage = "建立中" | "稳定" | "紧张" | "修复中" | "已结束" | "等待中"

export type RelationshipImpact = "滋养" | "消耗" | "中性" | "混合"

export type InteractionFrequency = "每天" | "每周" | "每月" | "每年" | "几乎不" | "已无联系"

export type UnfinishedWeight = "很重" | "中等" | "轻微" | "无"

export type RelationshipEventKind = "认识" | "重要谈话" | "冲突" | "和好" | "疏远" | "断联" | "重逢"

export type RelationshipChangeField = "depth" | "stage"

export type UnsentNoteTargetType = "关系条目" | "独立对象" | "未来的自己"

export type RelationshipEvent = {
  id: string
  date: string
  kind: RelationshipEventKind
  title: string
  summary: string
}

export type RelationshipChange = {
  id: string
  date: string
  field: RelationshipChangeField
  from: string
  to: string
  note: string
}

export type RelationshipUnsentNote = {
  id: string
  targetType: UnsentNoteTargetType
  relationshipId?: string
  to: string
  theme: string
  excerpt: string
  unfinishedWeight?: UnfinishedWeight
}

export type RelationshipPerson = {
  id: string
  name: string
  type: RelationshipType
  role: string
  depth: RelationshipDepth
  stage: RelationshipStage
  impact: RelationshipImpact
  interaction: InteractionFrequency
  unfinishedWeight?: UnfinishedWeight
  influence: string
  currentState: string
  emotionalTone: string
  unspokenLine: string
  positiveImpact: string
  ongoingShadow: string
  boundaryStatus: string
  events: RelationshipEvent[]
  emotionCues: string[]
  unsentLineIds: string[]
  history: RelationshipChange[]
  tags: string[]
}

export type RelationshipCircle = {
  id: string
  title: string
  summary: string
  entries: RelationshipPerson[]
}

export type RelationshipPattern = {
  id: string
  title: string
  summary: string
  cues: string[]
}

export type RelationshipMap = {
  circles: RelationshipCircle[]
  patterns: RelationshipPattern[]
  unsentNotes: RelationshipUnsentNote[]
}

export type MemoryType = "事件" | "地点" | "物件" | "人物" | "照片" | "领悟"

export type EmotionalWeight = "轻" | "中性" | "重" | "很重"

export type ProcessingStatus =
  | "已整理"
  | "正在理解"
  | "暂不触碰"
  | "决定不再细究"
  | "开放问题"
  | "想留给某人"
  | "记不清的裂缝"

export type PrivacyLevel = "仅自己" | "需二次确认" | "指定的人" | "未来可公开" | "离世后可看"

export type FormativePower = "极深" | "较深" | "中等" | "轻微" | "无"

export type MemorySourceModule =
  | "手动录入"
  | "反思"
  | "记事"
  | "记账"
  | "关系"
  | "情绪"
  | "原则"
  | "未来"
  | "生命整理"

export type GrowthDomain = "关系" | "自我" | "工作" | "情绪能力" | "生活方式"

export type GrowthStability = "偶尔还会退回去" | "基本稳定" | "已经完全内化"

export type GrowthNode = {
  id: string
  title: string
  domain: GrowthDomain
  stability: GrowthStability
  before: string
  after: string
  keyEvent: string
  beforeMemoryIds: string[]
  afterMemoryIds: string[]
  triggerMemoryId: string
  evidence: string[]
}

export type GrowthProfile = {
  growthNodes: GrowthNode[]
  threads: string[]
}

export type EmotionCheckIn = {
  id: string
  date: string
  summary: string
  state: string
  intensity: string
  bodySignal: string
  tags: string[]
}

export type EmotionTrendPoint = {
  id: string
  label: string
  score: number
  note: string
}

export type EmotionTriggerGroup = {
  id: string
  title: string
  summary: string
  cues: string[]
}

export type EmotionSupportTool = {
  id: string
  title: string
  description: string
  when: string
}

export type EmotionModuleData = {
  checkIns: EmotionCheckIn[]
  trend: EmotionTrendPoint[]
  triggers: EmotionTriggerGroup[]
  tools: EmotionSupportTool[]
}

export type CrisisCurrentState = {
  level: string
  summary: string
  firstStep: string
}

export type CrisisContact = {
  id: string
  name: string
  role: string
  when: string
  script: string
}

export type CrisisStep = {
  id: string
  title: string
  description: string
}

export type CrisisSupportModuleData = {
  currentState: CrisisCurrentState
  warningSigns: string[]
  contacts: CrisisContact[]
  steps: CrisisStep[]
  reviewNotes: string[]
}

export type MemoryEntry = {
  id: string
  title: string
  type: MemoryType
  era: string[]
  primaryEra: string
  emotionalWeight: EmotionalWeight
  processing: ProcessingStatus
  privacy: PrivacyLevel
  formativePower?: FormativePower
  summary: string
  impact: string
  sourceModules: MemorySourceModule[]
  sensoryCue?: string
  tags: string[]
}

export type MemoryAnchor = {
  id: string
  type: Extract<MemoryType, "地点" | "物件" | "照片" | "人物">
  label: string
  note: string
  linkedMemoryIds: string[]
}

export type MemoryModuleData = {
  memories: MemoryEntry[]
  anchors: MemoryAnchor[]
  eraSuggestions: string[]
  reviewPrompts: string[]
}

export type LegacyCategory = "重要交代" | "留给某人的话" | "人生回顾" | "未完成的事" | "纪念偏好"

export type LegacyRecipient = "特定的人" | "家人" | "朋友" | "公开" | "仅自己"

export type LegacyUrgency = "关键信息" | "重要" | "锦上添花" | "可选"

export type LegacyVisibility = "现在" | "某个时间后" | "我离世后" | "条件触发" | "永不交付"

export type LegacyStatus = "草稿" | "基本完成" | "已完成" | "会持续更新" | "最终版"

export type EmotionalLoad = "很重" | "中等" | "轻微" | "平静"

export type LegacyItem = {
  id: string
  title: string
  category: LegacyCategory
  recipient: LegacyRecipient
  recipientName?: string
  relatedRelationshipId?: string
  urgency: LegacyUrgency
  visibility: LegacyVisibility
  deliveryCondition?: string
  status: LegacyStatus
  emotionalLoad?: EmotionalLoad
  summary: string
  contentPreview: string
  isLocked: boolean
  updatedAt: string
  reviewCue: string
  tags: string[]
}

export type LegacyTrustBoundary = {
  id: string
  title: string
  detail: string
}

export type LegacyModuleData = {
  items: LegacyItem[]
  trustBoundaries: LegacyTrustBoundary[]
  reviewPrompts: string[]
}

export type OverviewModuleData = {
  greeting: string
  dailyPulse: string[]
  recentRecords: RecentRecord[]
}

export type ReflectionModuleData = {
  entries: ReflectionEntry[]
  draftExample: ReflectionDraftExample
}

export type EventsModuleData = {
  entries: EventEntry[]
}

export type FinanceModuleData = {
  entries: TransactionEntry[]
}

export type ShoppingModuleData = {
  systemDefinitions: ShoppingSystemDefinition[]
  spotlights: ShoppingSpotlight[]
  ownedItems: ShoppingOwnedItem[]
  purchaseLanes: ShoppingPurchaseLane[]
  stageChecklists: ShoppingStageChecklist[]
  priceReferences: ShoppingPriceReference[]
  boundaryEntries: ShoppingBoundaryEntry[]
  lifestyleCollections: ShoppingLifestyleCollection[]
}

export type BeliefsModuleData = BeliefProfile

export type PrinciplesModuleData = PrincipleProfile

export type RelationshipsModuleData = RelationshipMap

export type GrowthModuleData = GrowthProfile

export type MemoryWorkspaceModuleData = MemoryModuleData

export type JourneyModuleData = GrowthModuleData & MemoryModuleData

export type JourneyWorkspaceModuleData = JourneyModuleData

export type EmotionWorkspaceModuleData = EmotionModuleData

export type CrisisWorkspaceModuleData = CrisisSupportModuleData

export type LegacyWorkspaceModuleData = LegacyModuleData

export type FutureModuleData = FutureBlueprint

export type MealScene =
  | "在家做"
  | "外卖"
  | "堂食"
  | "路边/便利店"
  | "应酬/聚餐"
  | "旅行"
  | "加餐零食"

export type MealStructure = "早餐" | "午餐" | "晚餐" | "加餐" | "夜宵" | "节庆餐" | "饮品"

export type BeverageKind =
  | "含咖啡因"
  | "含酒精"
  | "含糖饮品"
  | "鲜榨果汁"
  | "茶水"
  | "奶/豆奶"
  | "其他"

export type MealComposition =
  | "主食为主"
  | "蛋白为主"
  | "蔬果为主"
  | "综合搭配"
  | "几乎只有碳水"
  | "几乎只有油盐糖"

export type MealOrigin = "家常" | "地方菜系" | "异国料理" | "工业速食" | "自给自种" | "节令食材"

export type MealTrigger =
  | "准时按点"
  | "真饿了"
  | "社交场合"
  | "情绪驱动"
  | "习惯反射"
  | "不想浪费"
  | "看到就想吃"

export type ValueDensity = "高" | "中" | "低" | "不划算"

export type BodyFeedback = "满足舒服" | "普通" | "偏重偏胀" | "不适" | "想再吃"

export type HardConstraintType = "过敏" | "宗教/文化" | "医学限制"

export type SoftStanceType = "饮食方式" | "进食节律" | "临时关注"

export type DietaryIntentMode = "维持" | "稍微注意" | "在调整具体问题" | "阶段性需求"

export type FoodMemoryType = "家庭味道" | "地方味道" | "关系味道" | "人生节点味道" | "已经吃不到的"

export type FoodMemoryAvailability = "仍能吃到" | "偶尔能吃到" | "已经吃不到" | "自己尝试复刻"

export type FoodMemoryEmotionalLoad = "很重" | "中等" | "轻微" | "平静"

export type DietaryHardConstraint = {
  id: string
  type: HardConstraintType
  label: string
  note: string
}

export type DietarySoftStance = {
  id: string
  type: SoftStanceType
  label: string
  note: string
}

export type DietaryIntent = {
  mode: DietaryIntentMode
  note?: string
  window?: {
    start: string
    end?: string
  }
}

export type DietaryProfile = {
  hardConstraints: DietaryHardConstraint[]
  softStances: DietarySoftStance[]
  currentIntent: DietaryIntent
}

export type NutritionMealEntry = {
  id: string
  date: string
  title: string
  scene: MealScene
  structure: MealStructure
  beverageKind?: BeverageKind
  composition?: MealComposition
  origin: MealOrigin
  trigger: MealTrigger
  valueDensity?: ValueDensity
  bodyFeedback?: BodyFeedback
  cost?: number
  companions?: string[]
  relatedFoodMemoryId?: string
  relatedFinanceEntryId?: string
  relatedEmotionEntryId?: string
  note: string
  detailSignals: string[]
}

export type NutritionFoodMemory = {
  id: string
  name: string
  type: FoodMemoryType
  flavorDescription?: string
  recipe?: string
  story: string
  currentAvailability: FoodMemoryAvailability
  emotionalLoad: FoodMemoryEmotionalLoad
  relatedPeople?: string[]
  relatedMemoryIds?: string[]
}

export type NutritionReviewInsight = {
  id: string
  title: string
  summary: string
  evidence: string[]
}

export type NutritionCrossViewRow = {
  label: string
  count: number
  valueDensity?: ValueDensity
  bodyFeedback?: BodyFeedback
}

export type NutritionCrossView = {
  id: string
  title: string
  summary: string
  rows: NutritionCrossViewRow[]
}

export type NutritionWeeklyReview = {
  highlights: NutritionReviewInsight[]
  missingSignals: string[]
  crossViews: NutritionCrossView[]
}

export type NutritionModuleData = {
  profile: DietaryProfile
  meals: NutritionMealEntry[]
  weeklyReview: NutritionWeeklyReview
  foodMemories: NutritionFoodMemory[]
}

export type SocioeconomicsEntry = {
  id: string
  title: string
  domain: string
  layer: string
  confidence: string
  source: string
  summary: string
}

export type SocioeconomicsModuleData = {
  entries: SocioeconomicsEntry[]
  gaps: string[]
}

export type WorkspaceSnapshot = {
  overview: OverviewModuleData
  reflection: ReflectionModuleData
  events: EventsModuleData
  finance: FinanceModuleData
  shopping: ShoppingModuleData
  nutrition: NutritionModuleData
  emotion: EmotionWorkspaceModuleData
  crisis: CrisisWorkspaceModuleData
  beliefs: BeliefsModuleData
  principles: PrinciplesModuleData
  relationships: RelationshipsModuleData
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  legacy: LegacyWorkspaceModuleData
  socioeconomics: SocioeconomicsModuleData
  future: FutureModuleData
}

export type WorkspaceModel = WorkspaceSnapshot
