import type { BenchmarkAccount, BenchmarkNote } from "@/lib/types";

const rawBenchmarkAccounts: Omit<BenchmarkAccount, "createdAt" | "updatedAt">[] = [
  {
    id: "bench-001",
    name: "重庆英语王老师",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=王老师",
    category: "本地英语老师",
    positioning: "小学英语提分、课堂片段、家长问答",
    url: "https://www.xiaohongshu.com/user/profile/bench-001",
    learnings: ["标题直接点年级", "评论区集中收集问题", "课堂片段只截关键 8 秒"],
  },
  {
    id: "bench-002",
    name: "三升四家长资料库",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=家长资料库",
    category: "家长博主",
    positioning: "资料整理、开学清单、同城陪学",
    url: "https://www.xiaohongshu.com/user/profile/bench-002",
    learnings: ["清单型封面保存率高", "资料领取适合作为低门槛 CTA", "不要直接卖课"],
  },
  {
    id: "bench-003",
    name: "山城升学英语观察",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=山城观察",
    category: "本地升学",
    positioning: "重庆区域升学、年级节点、路径规划",
    url: "https://www.xiaohongshu.com/user/profile/bench-003",
    learnings: ["区域词提升同城匹配", "痛点要落到年级", "适合开放日引流"],
  },
];

export const benchmarkAccounts: BenchmarkAccount[] = rawBenchmarkAccounts.map((item) => ({
  ...item,
  createdAt: "2026-06-29T10:00:00",
  updatedAt: "2026-07-24T10:00:00",
}));

const rawBenchmarkNotes: Omit<BenchmarkNote, "createdAt" | "updatedAt">[] = [
  {
    id: "bench-note-001",
    accountName: "重庆英语王老师",
    title: "三升四英语突然跟不上，暑假先别盲目刷题",
    hook: "先否定家长常见动作，再给出定位判断。",
    coverFormula: "年级 + 具体问题 + 红色圈重点",
    commentInsight: "家长集中问“怎么测”和“要不要报班”。",
    reusableDirection: "改写为开学前英语能力定位课入口。",
  },
  {
    id: "bench-note-002",
    accountName: "三升四家长资料库",
    title: "开学前 7 天英语自查表，家长可以先收藏",
    hook: "资料价值明确，低销售感。",
    coverFormula: "资料名称 + 局部预览 + 收藏提示",
    commentInsight: "评论多为年级和资料关键词。",
    reusableDirection: "适合 KOC 号做真实资料整理。",
  },
];

export const benchmarkNotes: BenchmarkNote[] = rawBenchmarkNotes.map((item) => ({
  ...item,
  createdAt: "2026-07-01T10:00:00",
  updatedAt: "2026-07-24T10:00:00",
}));

export const forbiddenCases = [
  "假装已经报名并推荐机构",
  "承诺短期必然提分或必然开口",
  "展示学生姓名、电话、完整人脸等隐私",
  "恶意对比或踩竞品",
  "批量复制评论、诱导虚假互动",
];
