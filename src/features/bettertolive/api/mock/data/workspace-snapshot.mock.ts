import { crisisMockData } from "@/features/bettertolive/api/mock/data/crisis/crisis.mock"
import { emotionMockData } from "@/features/bettertolive/api/mock/data/emotion/emotion.mock"
import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"
import { beliefsMockData } from "@/features/bettertolive/api/mock/data/beliefs/beliefs.mock"
import { eventsMockData } from "@/features/bettertolive/api/mock/data/events/events.mock"
import { financeMockData } from "@/features/bettertolive/api/mock/data/finance/finance.mock"
import { futureMockData } from "@/features/bettertolive/api/mock/data/future/future.mock"
import { growthMockData } from "@/features/bettertolive/api/mock/data/growth/growth.mock"
import { legacyMockData } from "@/features/bettertolive/api/mock/data/legacy/legacy.mock"
import { memoryMockData } from "@/features/bettertolive/api/mock/data/memory/memory.mock"
import { overviewMockData } from "@/features/bettertolive/api/mock/data/overview/overview.mock"
import { principlesMockData } from "@/features/bettertolive/api/mock/data/principles/principles.mock"
import { reflectionMockData } from "@/features/bettertolive/api/mock/data/reflection/reflection.mock"
import { relationshipsMockData } from "@/features/bettertolive/api/mock/data/relationships/relationships.mock"
import { shoppingMockData } from "@/features/bettertolive/api/mock/data/shopping/shopping.mock"

export const workspaceSnapshotMockData = {
  overview: overviewMockData,
  reflection: reflectionMockData,
  events: eventsMockData,
  finance: financeMockData,
  shopping: shoppingMockData,
  emotion: emotionMockData,
  crisis: crisisMockData,
  beliefs: beliefsMockData,
  principles: principlesMockData,
  relationships: relationshipsMockData,
  growth: growthMockData,
  memory: memoryMockData,
  legacy: legacyMockData,
  future: futureMockData,
} satisfies WorkspaceSnapshot
