import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"
import { beliefsMockData } from "@/features/bettertolive/api/mock/data/beliefs/beliefs.mock"
import { eventsMockData } from "@/features/bettertolive/api/mock/data/events/events.mock"
import { financeMockData } from "@/features/bettertolive/api/mock/data/finance/finance.mock"
import { futureMockData } from "@/features/bettertolive/api/mock/data/future/future.mock"
import { growthMockData } from "@/features/bettertolive/api/mock/data/growth/growth.mock"
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
  beliefs: beliefsMockData,
  principles: principlesMockData,
  relationships: relationshipsMockData,
  growth: growthMockData,
  future: futureMockData,
} satisfies WorkspaceSnapshot
