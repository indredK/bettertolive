import type { ReflectionModuleData } from "@/features/bettertolive/models/workspace"

export const emptyReflectionModuleData = {
  entries: [],
  draftExample: {
    content: "",
    tags: [],
  },
} satisfies ReflectionModuleData
