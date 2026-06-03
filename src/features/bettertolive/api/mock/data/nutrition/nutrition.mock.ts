import type { NutritionModuleData } from "@/features/bettertolive/models/workspace"

export const nutritionMockData = {
  meals: [
    {
      id: "meal-1",
      date: "2026-06-02",
      scene: "在家做",
      structure: "午餐",
      composition: "综合搭配",
      trigger: "准时按点",
      valueDensity: "高",
      bodyFeedback: "满足舒服",
      note: "杂粮饭加清蒸鱼和焯青菜，下午精神很稳。",
    },
    {
      id: "meal-2",
      date: "2026-06-01",
      scene: "外卖",
      structure: "晚餐",
      composition: "综合搭配",
      trigger: "情绪驱动",
      valueDensity: "中",
      bodyFeedback: "偏重偏胀",
      note: "加班后点了麻辣烫，吃完睡眠变差。",
    },
    {
      id: "meal-3",
      date: "2026-05-31",
      scene: "路边/便利店",
      structure: "饮品",
      composition: "几乎只有油盐糖",
      trigger: "习惯反射",
      valueDensity: "不划算",
      bodyFeedback: "想再吃",
      note: "下午到点就想喝奶茶。",
    },
  ],
  weeklyHighlights: [
    "在家做的比例比上周提高，身体反馈普遍更好。",
    "情绪驱动的进食基本集中在加班晚上。",
    "蔬果出现频次仍然偏低，需要补一补。",
  ],
  foodMemories: [
    {
      id: "food-memory-1",
      name: "妈妈做的红烧肉",
      type: "家庭味道",
      story: "小时候过年时桌上一定要有这道菜。",
    },
    {
      id: "food-memory-2",
      name: "学校楼下的酸辣粉",
      type: "地方味道",
      story: "高三晚自习下课后常去的那家，店已经搬走。",
    },
  ],
} satisfies NutritionModuleData
