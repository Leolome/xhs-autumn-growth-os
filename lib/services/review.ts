import { nextWeekActions as mockNextWeekActions } from "@/data/mock-review";
import { getTopTasks } from "@/lib/analytics";
import { getAccounts } from "@/lib/services/accounts";
import { getBookings } from "@/lib/services/bookings";
import { getLeads } from "@/lib/services/leads";
import { getTasks } from "@/lib/services/tasks";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import type { ReviewWeeklySummaryRow } from "@/lib/supabase/database.types";
import type { GrowthTask, ReviewItem } from "@/lib/types";

export type ReviewWeeklySummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  weekStart: string;
  weekEnd: string;
  summary: Record<string, unknown>;
  nextActions: Array<Record<string, unknown>>;
};

function mapReviewWeeklySummaryRow(row: ReviewWeeklySummaryRow): ReviewWeeklySummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    summary: row.summary,
    nextActions: row.next_actions,
  };
}

function getLowPerformanceContent(tasks: GrowthTask[]) {
  return tasks
    .filter((task) => task.metrics && task.metrics.dm === 0)
    .slice(0, 5)
    .map((task) => ({
      ...task,
      reason: "互动有基础，但后链路私信不足，需要增强 CTA 和评论区承接。",
    }));
}

async function getReviewWeeklySummaries(): Promise<ReviewWeeklySummary[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("review_weekly_summaries")
    .select("*")
    .order("week_start", { ascending: false });

  if (error || !data?.length) return [];
  return data.map(mapReviewWeeklySummaryRow);
}

export async function getReviewData() {
  const [accounts, tasks, leads, bookings, weeklySummaries] = await Promise.all([
    getAccounts(),
    getTasks(),
    getLeads(),
    getBookings(),
    getReviewWeeklySummaries(),
  ]);

  const latestSummary = weeklySummaries[0];
  const nextWeekActions =
    latestSummary?.nextActions
      ?.map((item, index) => ({
        id: String(item.id ?? `summary-action-${index}`),
        createdAt: latestSummary.createdAt,
        updatedAt: latestSummary.updatedAt,
        title: String(item.title ?? "下周动作"),
        owner: String(item.owner ?? "待分配"),
        campus: (item.campus ?? "其他") as ReviewItem["campus"],
        score: Number(item.score ?? 70),
        reason: String(item.reason ?? "来自每周复盘记录。"),
      }))
      .filter((item): item is ReviewItem => Boolean(item.title)) ?? mockNextWeekActions;

  return {
    accounts,
    tasks,
    leads,
    bookings,
    topContent: getTopTasks(tasks).slice(0, 5),
    lowPerformanceContent: getLowPerformanceContent(tasks),
    nextWeekActions,
    weeklySummaries,
  };
}
