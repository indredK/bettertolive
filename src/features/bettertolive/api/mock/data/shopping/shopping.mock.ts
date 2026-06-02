import type { ShoppingModuleData } from "@/features/bettertolive/models/workspace"

export const shoppingMockData = {
  columns: [
    {
      id: "wishlist",
      title: "想买",
      subtitle: "更像愿望和向往",
      items: [
        {
          id: "wish-1",
          title: "人体工学椅",
          note: "想给长期坐着工作的身体更多支持。",
          price: "¥1,299",
        },
        {
          id: "wish-2",
          title: "新耳机",
          note: "希望把通勤和独处切得更干净一点。",
          price: "¥899",
        },
        {
          id: "wish-3",
          title: "便携显示器",
          note: "想试着把工作空间做得更自由。",
          price: "¥1,599",
        },
      ],
    },
    {
      id: "planned",
      title: "待买",
      subtitle: "更像现实安排",
      items: [
        {
          id: "planned-1",
          title: "收纳盒",
          note: "保持桌面空出来，脑子也会轻一点。",
          price: "¥49",
        },
        {
          id: "planned-2",
          title: "洗衣液",
          note: "很普通，但它保证生活转得下去。",
          price: "¥39",
        },
        {
          id: "planned-3",
          title: "床边灯",
          note: "想把夜里读书那段时间留得更舒服。",
          price: "¥129",
        },
      ],
    },
    {
      id: "bought",
      title: "已买",
      subtitle: "已经变成现实",
      items: [
        {
          id: "bought-1",
          title: "黑色笔记本",
          note: "最近想让记东西这件事重新变得顺手。",
          price: "¥36",
        },
        {
          id: "bought-2",
          title: "桌面台灯",
          note: "想要一个更像工作台的夜晚。",
          price: "¥159",
        },
        {
          id: "bought-3",
          title: "新拖鞋",
          note: "看起来很小，但它让我更愿意待在家里。",
          price: "¥29",
        },
      ],
    },
  ],
} satisfies ShoppingModuleData
