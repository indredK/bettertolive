import type { BeliefsModuleData } from "@/features/bettertolive/models/workspace"

export const emptyBeliefsModuleData = {
  cards: [],
  questions: [],
  entries: [],
  relations: [],
  attachmentReflection: "",
} satisfies BeliefsModuleData
