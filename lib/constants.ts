import type { Campus, LeadStage, TaskStatus } from "@/lib/types";

export const campuses: Campus[] = ["礼嘉", "北岸", "人和", "九龙坡", "凯德", "其他"];

export const stageLabels: Record<LeadStage, string> = {
  new: "新线索",
  dm_opened: "已私信",
  resource_sent: "已领资料",
  assessed: "已体检",
  group_joined: "已进群",
  to_invite: "待邀约",
  booked: "已预约",
  arrived: "已到课",
  strong_intent: "强意向",
  converted: "已转化",
  nurturing: "长期养熟",
  lost: "已流失",
};

export const leadStageOrder: LeadStage[] = [
  "new",
  "dm_opened",
  "resource_sent",
  "assessed",
  "group_joined",
  "to_invite",
  "booked",
  "arrived",
  "strong_intent",
  "converted",
  "nurturing",
  "lost",
];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "未开始",
  drafting: "已写文案",
  published: "已发布",
  data_filled: "已回填数据",
  reviewed: "已复盘",
};

export const taskStatusTone: Record<TaskStatus, "muted" | "blue" | "green" | "amber" | "slate"> = {
  todo: "muted",
  drafting: "blue",
  published: "green",
  data_filled: "amber",
  reviewed: "slate",
};

export const productPeriod = {
  start: "2026-07-01",
  end: "2026-08-31",
};

export const contentTypes = [
  "提问笔记",
  "资料分析",
  "课堂互动视频",
  "板书分享",
  "学员展示",
  "开学倒计时",
  "体检转化",
  "家长共情",
  "其他",
] as const;

export const kocContentTypes = ["生活化定位内容", "真实问题收集", "资料分享", "校区周边内容"] as const;

export const bookingStatusLabels = {
  to_invite: "待邀约",
  pending_reply: "已邀约待回复",
  booked: "已预约",
  rescheduled: "已改期",
  no_show: "未到",
  arrived: "已到课",
  feedback_done: "已反馈",
  strong_intent: "已转强意向",
  registered: "已报名",
  not_now: "暂不考虑",
} as const;

export const navItems = [
  { href: "/dashboard", label: "今天总览", description: "先看今天该盯什么" },
  { href: "/accounts", label: "账号管理", description: "老师号和家长号" },
  { href: "/crawler", label: "每周数据", description: "每周采集一次" },
  { href: "/calendar", label: "发什么", description: "按账号看每周任务" },
  { href: "/koc-tasks", label: "家长号建议", description: "每个校区发什么" },
  { href: "/benchmarks", label: "参考账号", description: "可学的账号和笔记" },
  { href: "/lead-pool", label: "家长线索", description: "谁最值得跟进" },
  { href: "/invitations", label: "到店邀约", description: "谁该约到线下" },
];
