import { accounts } from "@/data/mock-accounts";
import { tasks } from "@/data/mock-tasks";
import { getTopTasks } from "@/lib/analytics";
import type { ReviewItem } from "@/lib/types";

export const topContent = getTopTasks(tasks).slice(0, 5);

export const lowPerformanceContent = tasks
  .filter((task) => task.metrics && task.metrics.dm === 0)
  .slice(0, 5)
  .map((task) => ({
    ...task,
    reason: "互动有基础，但后链路私信不足，需要增强 CTA 和评论区承接。",
  }));

export const campusRankings = accounts.reduce<Record<string, { campus: string; leads: number; bookings: number }>>(
  (acc, account) => {
    acc[account.campus] ??= { campus: account.campus, leads: 0, bookings: 0 };
    acc[account.campus].leads += account.leads.dm + account.leads.assessments + account.leads.groups;
    acc[account.campus].bookings += account.leads.bookings;
    return acc;
  },
  {},
);

const rawNextWeekActions: Omit<ReviewItem, "createdAt" | "updatedAt">[] = [
  {
    id: "action-001",
    title: "把三升四定位课 CTA 固定到老师号 TOP 内容尾部",
    owner: "Matt",
    campus: "礼嘉",
    score: 92,
    reason: "高互动内容已经验证，下一步要提升私信和预约。",
  },
  {
    id: "action-002",
    title: "人和校区补齐 KOC 号资料分享和问题收集任务",
    owner: "人和校区",
    campus: "人和",
    score: 76,
    reason: "发布完成率偏低，线索池阶段停留在资料和进群。",
  },
  {
    id: "action-003",
    title: "凯德开放日增加小升初路径主题",
    owner: "Molly",
    campus: "凯德",
    score: 88,
    reason: "五升六强意向集中，适合从内容直接导开放日。",
  },
];

export const nextWeekActions: ReviewItem[] = rawNextWeekActions.map((item) => ({
  ...item,
  createdAt: "2026-07-24T17:00:00",
  updatedAt: "2026-07-24T17:00:00",
}));
