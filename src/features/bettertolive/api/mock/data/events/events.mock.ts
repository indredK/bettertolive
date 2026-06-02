import type { EventsModuleData } from "@/features/bettertolive/models/workspace"

export const eventsMockData = {
  entries: [
    {
      id: "event-1",
      date: "06-02 19:20",
      title: "和朋友聊未来城市选择",
      excerpt: "原来我想换的不是城市本身，而是那种更自由的生活结构。",
      theme: "生活方式",
    },
    {
      id: "event-2",
      date: "06-01 23:12",
      title: "晚上重新整理了房间",
      excerpt:
        "收拾空间的时候，能感觉到自己在试图重新获得秩序感，也更容易开始思考长期安排。",
      theme: "秩序感",
    },
    {
      id: "event-3",
      date: "05-31 16:40",
      title: "记下一句关于自由职业的判断",
      excerpt: "“我想做的不是更多，而是更真。”",
      theme: "表达",
    },
  ],
} satisfies EventsModuleData
