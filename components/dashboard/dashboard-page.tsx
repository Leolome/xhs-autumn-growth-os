import { AlertTriangle, ShieldCheck, Users } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { getCampusLeadRankings, getDashboardCommentBoard, getDashboardKpis, getDashboardRisks } from "@/lib/analytics";
import { roleLabels, type UserContext } from "@/lib/auth/types";
import type { Account, GrowthTask, Lead } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function DashboardPage({
  accounts,
  tasks,
  leads,
  user,
}: {
  accounts: Account[];
  tasks: GrowthTask[];
  leads: Lead[];
  user?: UserContext;
}) {
  const kpis = getDashboardKpis(accounts, tasks, leads);
  const risks = getDashboardRisks(accounts, tasks, leads);
  const campusRankings = getCampusLeadRankings(leads);
  const commentBoard = getDashboardCommentBoard(leads);

  return (
    <AppShell user={user}>
      <PageHeader
        title="今天总览"
        description="这里不再堆很多图。只保留负责人今天要盯的关键数字、风险、校区排行和家长在问什么。"
        action={<Button variant="outline">导出周报</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="本周发布完成情况" value={`${kpis.completeRate}%`} detail={`已完成 ${kpis.published} 条`} tone="green" />
        <MetricCard label="账号总数" value={kpis.accountCount} detail="老师号 + 家长视角号" tone="slate" />
        <MetricCard label="本周新增互动" value={formatNumber(kpis.weekInteractions)} detail="点赞、收藏、评论合计" tone="blue" />
        <MetricCard label="新增线索" value={kpis.newLeads} detail="本周新进来的家长" tone="amber" />
        <MetricCard label="新增蓄水池" value={kpis.poolAdds} detail="已进入线索池管理" tone="slate" />
        <MetricCard label="线下转化数" value={kpis.offlineConversions} detail="本周已转化家长" tone="green" />
        <MetricCard label="高意向家长数" value={kpis.highIntentCount} detail="建议今天优先跟进" tone="red" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>各校区线索排行</CardTitle>
            <CardDescription>看哪个校区线索最多，哪个校区承接压力更大。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {campusRankings.length ? (
              campusRankings.map((campus) => (
                <div key={campus.campus} className="rounded-lg border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{campus.campus}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        线索 {campus.leads} · 已邀约/已到课 {campus.bookings} · 高意向 {campus.highIntent}
                      </p>
                    </div>
                    <Badge tone={campus.highIntent >= 3 ? "green" : "amber"}>{campus.leads} 条</Badge>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round((campus.leads / Math.max(campusRankings[0]?.leads ?? 1, 1)) * 100))}
                    className="mt-3"
                  />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                还没有线索数据。
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>风险提醒</CardTitle>
            <CardDescription>今天先处理这些异常，避免后面整条链路卡住。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {risks.length ? (
              risks.map((risk) => (
                <div
                  key={risk.title}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    risk.tone === "red" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <AlertTriangle className={risk.tone === "red" ? "mt-0.5 text-red-700" : "mt-0.5 text-amber-700"} />
                  <div>
                    <p className="text-sm font-medium">{risk.title}</p>
                    <p className={risk.tone === "red" ? "text-xs leading-5 text-red-800" : "text-xs leading-5 text-amber-800"}>
                      {risk.detail}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                当前没有明显风险。
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck />
              权限与校区
            </CardTitle>
            <CardDescription>当前登录账号能看哪个校区、是什么角色，一眼说明白。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--muted-foreground)]">当前身份</p>
              <p className="mt-2 text-lg font-semibold">{user ? roleLabels[user.role] : "内部成员"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--muted-foreground)]">可见校区</p>
              <p className="mt-2 text-lg font-semibold">{user?.campus ?? "全部校区"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--muted-foreground)]">归属账号</p>
              <p className="mt-2 text-lg font-semibold">{user?.ownerAccountIds?.length ? `${user.ownerAccountIds.length} 个` : "未限制"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users />
              用户评论区
            </CardTitle>
            <CardDescription>这里不看虚空“互动热闹”，只看家长到底在问什么、抱怨什么。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {commentBoard.length ? (
              commentBoard.map((topic) => (
                <div key={topic.topic} className="rounded-lg border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{topic.topic}</p>
                    <Badge tone={topic.count >= 2 ? "blue" : "slate"}>{topic.count} 位家长提到</Badge>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {topic.examples.map((example) => (
                      <div key={`${topic.topic}-${example.parentNickname}`} className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm">
                        <span className="font-medium">{example.parentNickname}</span>
                        <span className="text-[var(--muted-foreground)]"> · {example.owner}</span>
                        <p className="mt-1 text-[var(--muted-foreground)]">{example.latestActivity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                还没有足够的家长反馈数据。
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
