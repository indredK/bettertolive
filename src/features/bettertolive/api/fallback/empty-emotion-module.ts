import type { EmotionWorkspaceModuleData } from "@/features/bettertolive/models/workspace"

export const emptyEmotionModuleData = {
  checkIns: [],
  trend: [],
  triggers: [],
  tools: [],
  overview: {
    windowLabel: "",
    averageScore: 0,
    topEmotionTags: [],
    bestWindow: "",
    worstWindow: "",
    conclusion: "",
  },
  timelineSegments: [],
  loopPatterns: [],
  lifestyleLinks: [],
  environmentCues: [],
  relationshipCues: [],
  recoveryNotes: [],
  ineffectiveActions: [],
  minimalRecoverySteps: [],
} satisfies EmotionWorkspaceModuleData
