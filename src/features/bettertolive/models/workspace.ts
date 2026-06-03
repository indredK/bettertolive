export type AppView =
  | "overview"
  | "reflection"
  | "events"
  | "finance"
  | "shopping"
  | "emotion"
  | "crisis"
  | "beliefs"
  | "principles"
  | "relationships"
  | "growth"
  | "memory"
  | "legacy"
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

export type ShoppingOwnedItem = {
  id: string
  name: string
  category: string
  space: string
  quantity: number
  status: string
  replacementCue: string
  note: string
}

export type ShoppingNeedLevel = "最低配置" | "必要" | "改善体验" | "提升幸福感"

export type ShoppingPlanItem = {
  id: string
  name: string
  category: string
  stage: string
  space: string
  necessity: ShoppingNeedLevel
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

export type ShoppingStageChecklist = {
  id: string
  title: string
  description: string
  focus: string
  minimum: string[]
  essentials: string[]
  upgrades: string[]
}

export type ShoppingPriceReference = {
  id: string
  category: string
  entryPrice: number
  sweetSpotPrice: number
  overpayPrice: number
  note: string
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

export type PrincipleEntry = {
  id: string
  title: string
  description: string
  boundary: string
  source: string
}

export type PrincipleProfile = {
  entries: PrincipleEntry[]
  boundaries: string[]
}

export type RelationshipPerson = {
  id: string
  name: string
  role: string
  influence: string
  currentState: string
  emotionalTone: string
  unspokenLine: string
}

export type RelationshipCircle = {
  id: string
  title: string
  summary: string
  entries: RelationshipPerson[]
}

export type RelationshipMoment = {
  id: string
  person: string
  title: string
  impact: string
}

export type RelationshipUnsentNote = {
  id: string
  to: string
  theme: string
  excerpt: string
}

export type RelationshipMap = {
  circles: RelationshipCircle[]
  patterns: string[]
  moments: RelationshipMoment[]
  unsentNotes: RelationshipUnsentNote[]
}

export type GrowthStage = {
  id: string
  stage: string
  title: string
  environment: string
  impact: string
  traces: string[]
}

export type GrowthProfile = {
  stages: GrowthStage[]
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

export type MemoryNode = {
  id: string
  period: string
  title: string
  summary: string
  impact: string
  tags: string[]
}

export type MemoryAnchor = {
  id: string
  type: string
  label: string
  note: string
}

export type MemoryModuleData = {
  nodes: MemoryNode[]
  anchors: MemoryAnchor[]
  reviewPrompts: string[]
}

export type LegacyDirective = {
  id: string
  title: string
  detail: string
}

export type LegacyLetter = {
  id: string
  to: string
  theme: string
  excerpt: string
}

export type LegacyWish = {
  id: string
  title: string
  detail: string
}

export type LegacyPreference = {
  id: string
  label: string
  note: string
}

export type LegacyModuleData = {
  directives: LegacyDirective[]
  letters: LegacyLetter[]
  wishes: LegacyWish[]
  preferences: LegacyPreference[]
  lifeReview: string[]
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
  spotlights: ShoppingSpotlight[]
  ownedItems: ShoppingOwnedItem[]
  purchaseLanes: ShoppingPurchaseLane[]
  stageChecklists: ShoppingStageChecklist[]
  priceReferences: ShoppingPriceReference[]
  lifestyleCollections: ShoppingLifestyleCollection[]
}

export type BeliefsModuleData = BeliefProfile

export type PrinciplesModuleData = PrincipleProfile

export type RelationshipsModuleData = RelationshipMap

export type GrowthModuleData = GrowthProfile

export type MemoryWorkspaceModuleData = MemoryModuleData

export type EmotionWorkspaceModuleData = EmotionModuleData

export type CrisisWorkspaceModuleData = CrisisSupportModuleData

export type LegacyWorkspaceModuleData = LegacyModuleData

export type FutureModuleData = FutureBlueprint

export type WorkspaceSnapshot = {
  overview: OverviewModuleData
  reflection: ReflectionModuleData
  events: EventsModuleData
  finance: FinanceModuleData
  shopping: ShoppingModuleData
  emotion: EmotionWorkspaceModuleData
  crisis: CrisisWorkspaceModuleData
  beliefs: BeliefsModuleData
  principles: PrinciplesModuleData
  relationships: RelationshipsModuleData
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  legacy: LegacyWorkspaceModuleData
  future: FutureModuleData
}

export type WorkspaceModel = WorkspaceSnapshot
