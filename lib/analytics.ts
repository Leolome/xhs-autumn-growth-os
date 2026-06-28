import { leadStageOrder } from "@/lib/constants";
import { getContentEffectiveness } from "@/lib/scoring";
import type { Account, GrowthTask, Lead } from "@/lib/types";

const DASHBOARD_NOW = new Date("2026-07-24T12:00:00");
const WEEK_START = new Date("2026-07-20T00:00:00");

function isThisWeek(iso: string) {
  const value = new Date(iso).getTime();
  return value >= WEEK_START.getTime() && value <= DASHBOARD_NOW.getTime();
}

export function getDashboardKpis(accounts: Account[], tasks: GrowthTask[], leads: Lead[]) {
  const expected = accounts.reduce((sum, account) => sum + account.weekExpected, 0);
  const published = accounts.reduce((sum, account) => sum + account.weekPublished, 0);
  const completeRate = Math.round((published / Math.max(expected, 1)) * 100);
  const weekInteractions = tasks.reduce(
    (sum, task) => sum + (task.metrics?.likes ?? 0) + (task.metrics?.saves ?? 0) + (task.metrics?.comments ?? 0),
    0,
  );
  const newLeads = leads.filter((lead) => isThisWeek(lead.createdAt)).length;
  const poolAdds = leads.filter((lead) => isThisWeek(lead.createdAt) && lead.stage !== "lost").length;
  const offlineConversions = leads.filter((lead) => lead.stage === "converted" && isThisWeek(lead.latestActivityAt)).length;
  const highIntentCount = leads.filter((lead) => ["A", "B"].includes(lead.intentLevel) || lead.stage === "strong_intent").length;

  return {
    completeRate,
    published,
    accountCount: accounts.length,
    weekInteractions,
    newLeads,
    poolAdds,
    offlineConversions,
    highIntentCount,
  };
}

export function getLeadFunnel(leads: Lead[]) {
  return leadStageOrder.slice(0, 10).map((stage) => ({
    stage,
    value: leads.filter((lead) => lead.stage === stage).length,
  }));
}

export function getTopTasks(tasks: GrowthTask[]) {
  return [...tasks]
    .filter((task) => task.metrics)
    .map((task) => ({ ...task, effectiveness: getContentEffectiveness(task) }))
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, 8);
}

export function getCampusLeadRankings(leads: Lead[]) {
  return Object.values(
    leads.reduce<Record<string, { campus: string; leads: number; bookings: number; highIntent: number }>>((acc, lead) => {
      acc[lead.campus] ??= { campus: lead.campus, leads: 0, bookings: 0, highIntent: 0 };
      acc[lead.campus].leads += 1;
      if (["booked", "arrived", "strong_intent", "converted"].includes(lead.stage)) {
        acc[lead.campus].bookings += 1;
      }
      if (["A", "B"].includes(lead.intentLevel) || lead.stage === "strong_intent") {
        acc[lead.campus].highIntent += 1;
      }
      return acc;
    }, {}),
  ).sort((a, b) => b.leads - a.leads);
}

export function getDashboardRisks(accounts: Account[], tasks: GrowthTask[], leads: Lead[]) {
  const risks = [];

  const staleAccount = accounts.find((account) => account.status === "risk");
  if (staleAccount) {
    risks.push({
      title: `${staleAccount.name} 连续 6 天无稳定发布`,
      detail: "账号处于风险状态，建议校区负责人今天确认内容素材和发布时间。",
      tone: "red" as const,
    });
  }

  const lowCompletion = accounts.find((account) => account.weekPublished / account.weekExpected < 0.75);
  if (lowCompletion) {
    risks.push({
      title: `${lowCompletion.campus} 发帖完成率低`,
      detail: `${lowCompletion.name} 本周完成 ${lowCompletion.weekPublished}/${lowCompletion.weekExpected}，需要补发布与数据回填。`,
      tone: "amber" as const,
    });
  }

  const highEngagementNoDm = tasks.find((task) => {
    const metrics = task.metrics;
    return metrics && metrics.likes + metrics.saves + metrics.comments > 120 && metrics.dm === 0;
  });
  if (highEngagementNoDm) {
    risks.push({
      title: "互动高但无私信",
      detail: `${highEngagementNoDm.contentType} 内容需要强化评论关键词和定位课 CTA。`,
      tone: "amber" as const,
    });
  }

  const campusRankings = getCampusLeadRankings(leads);
  const leadRichButLowBooking = campusRankings.find((campus) => campus.leads >= 20 && campus.bookings <= 2);
  if (leadRichButLowBooking) {
    risks.push({
      title: `${leadRichButLowBooking.campus} 线索多但邀约少`,
      detail: `当前线索 ${leadRichButLowBooking.leads}，预约 ${leadRichButLowBooking.bookings}，建议邀约中心优先处理。`,
      tone: "amber" as const,
    });
  }

  const overdueALead = leads.find((lead) => lead.intentLevel === "A" && new Date(lead.nextFollowUpAt).getTime() < new Date("2026-07-24T12:00:00").getTime());
  if (overdueALead) {
    risks.push({
      title: "A 类线索超过 24 小时未跟进",
      detail: `${overdueALead.parentNickname} 下一步为“${overdueALead.nextAction}”，请 ${overdueALead.owner} 今日处理。`,
      tone: "red" as const,
    });
  }

  return risks;
}

export function getDashboardCommentBoard(leads: Lead[]) {
  const grouped = new Map<
    string,
    { topic: string; count: number; examples: Array<{ parentNickname: string; owner: string; latestActivity: string }> }
  >();

  for (const lead of leads) {
    const topic = lead.painPoints[0] ?? "家长在问校区安排";
    const current = grouped.get(topic) ?? { topic, count: 0, examples: [] };
    current.count += 1;
    if (current.examples.length < 2) {
      current.examples.push({
        parentNickname: lead.parentNickname,
        owner: lead.owner,
        latestActivity: lead.latestActivity,
      });
    }
    grouped.set(topic, current);
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}
