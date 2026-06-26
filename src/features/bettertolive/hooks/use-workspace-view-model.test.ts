import type { TFunction } from "i18next"

import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
import { buildWorkspaceViewModel } from "@/features/bettertolive/hooks/use-workspace-view-model"
import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"

function createTranslator(): TFunction {
  return ((key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key) as unknown as TFunction
}

function createWorkspaceSnapshot(): WorkspaceSnapshot {
  return structuredClone(workspaceSnapshotMockData)
}

describe("buildWorkspaceViewModel", () => {
  it("filters only the active view", () => {
    const workspace = createWorkspaceSnapshot()

    workspace.reflection.entries = [
      {
        id: "reflection-needle",
        date: "2026-06-20",
        title: "Needle reflection",
        excerpt: "matched entry",
        tags: ["focus"],
      },
      {
        id: "reflection-noise",
        date: "2026-06-19",
        title: "Background note",
        excerpt: "does not match",
        tags: ["noise"],
      },
    ]
    workspace.finance.entries = [
      {
        id: "finance-1",
        date: "2026-06-20",
        label: "Groceries",
        category: "food",
        amount: 42,
        direction: "expense",
        note: "baseline entry",
        account: "cash",
        lifeSystem: "basic_life",
        necessity: "essential",
        reviewStatus: "confirmed",
        linkedModule: "manual",
        tags: ["weekly"],
      },
    ]

    const viewModel = buildWorkspaceViewModel({
      activeView: "reflection",
      searchQuery: "needle",
      t: createTranslator(),
      workspace,
    })

    expect(viewModel.reflections).toHaveLength(1)
    expect(viewModel.reflections[0]?.id).toBe("reflection-needle")
    expect(viewModel.transactions).toHaveLength(1)
    expect(viewModel.transactions[0]?.id).toBe("finance-1")
  })
})
