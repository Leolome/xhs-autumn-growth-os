"use client";

import { Download } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bookingStatusLabels, stageLabels } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { getContentEffectiveness } from "@/lib/scoring";
import type { UserContext } from "@/lib/auth/types";
import type { Account, Booking, GrowthTask, Lead, ReviewItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ReviewPage({
  accounts,
  tasks,
  leads,
  bookings,
  topContent,
  lowPerformanceContent,
  nextWeekActions,
  user,
}: {
  accounts: Account[];
  tasks: GrowthTask[];
  leads: Lead[];
  bookings: Booking[];
  topContent: Array<GrowthTask & { effectiveness: number }>;
  lowPerformanceContent: Array<GrowthTask & { reason: string }>;
  nextWeekActions: ReviewItem[];
  user?: UserContext;
}) {
  const campusRows = Object.values(
    leads.reduce<Record<string, { campus: string; leads: number; bookings: number }>>((acc, lead) => {
      acc[lead.campus] ??= { campus: lead.campus, leads: 0, bookings: 0 };
      acc[lead.campus].leads += 1;
      if (["booked", "arrived", "strong_intent", "converted"].includes(lead.stage)) acc[lead.campus].bookings += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.leads - a.leads);
  const publishedTasks = tasks.filter((task) => ["published", "data_filled", "reviewed"].includes(task.status));
  const contentTypeRows = Object.values(
    publishedTasks.reduce<Record<string, { type: string; tasks: number; dm: number; assessments: number; bookings: number; score: number }>>((acc, task) => {
      acc[task.contentType] ??= { type: task.contentType, tasks: 0, dm: 0, assessments: 0, bookings: 0, score: 0 };
      acc[task.contentType].tasks += 1;
      acc[task.contentType].dm += task.metrics?.dm ?? 0;
      acc[task.contentType].assessments += task.metrics?.assessments ?? 0;
      acc[task.contentType].bookings += task.metrics?.bookings ?? 0;
      acc[task.contentType].score += getContentEffectiveness(task);
      return acc;
    }, {}),
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  function exportReview() {
    downloadCsv("每周复盘-内容表现.csv", [
      ...topContent.map((task) => ({
        类型: "TOP内容",
        内容标题: task.suggestedTitle,
        校区: task.campus,
        内容类型: task.contentType,
        私信: task.metrics?.dm ?? 0,
        体检: task.metrics?.assessments ?? 0,
        预约: task.metrics?.bookings ?? 0,
        有效分: task.effectiveness,
      })),
      ...lowPerformanceContent.map((task) => ({
        类型: "低效内容",
        内容标题: task.suggestedTitle,
        校区: task.campus,
        内容类型: task.contentType,
        私信: task.metrics?.dm ?? 0,
        体检: task.metrics?.assessments ?? 0,
        预约: task.metrics?.bookings ?? 0,
        有效分: getContentEffectiveness(task),
        复盘原因: task.reason,
      })),
    ]);
    downloadCsv("每周复盘-线索邀约.csv", [
      ...leads.map((lead) => ({
        类型: "线索",
        家长昵称: lead.parentNickname,
        孩子年级: lead.studentGrade,
        校区: lead.campus,
        阶段: stageLabels[lead.stage],
        意向等级: lead.intentLevel,
        跟进人: lead.owner,
        下一步: lead.nextAction,
      })),
      ...bookings.map((booking) => ({
        类型: "邀约",
        校区: booking.campus,
        活动类型: booking.eventType,
        预约时间: formatDateTime(booking.scheduledAt),
        状态: bookingStatusLabels[booking.status],
        接待老师: booking.receptionTeacher ?? "",
        下一步: booking.nextAction,
      })),
    ]);
    downloadCsv("每周复盘-下周动作.csv", nextWeekActions.map((action) => ({
      校区: action.campus,
      负责人: action.owner,
      动作: action.title,
      优先级: action.score,
      原因: action.reason,
    })));
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="Review 每周复盘室"
        description="把内容表现、账号完成率、校区线索、邀约结果与下周动作建议放到一次周会上。"
        action={<Button variant="outline" onClick={exportReview}><Download data-icon="inline-start" />导出复盘</Button>}
      />
      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-[var(--muted-foreground)]">本周发布</p><p className="mt-2 text-3xl font-semibold">{publishedTasks.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-[var(--muted-foreground)]">新增线索</p><p className="mt-2 text-3xl font-semibold">{leads.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-[var(--muted-foreground)]">本周邀约</p><p className="mt-2 text-3xl font-semibold">{bookings.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-[var(--muted-foreground)]">到课/报名</p><p className="mt-2 text-3xl font-semibold">{bookings.filter((booking) => ["arrived", "feedback_done", "strong_intent", "registered"].includes(booking.status)).length}</p></CardContent></Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>TOP 内容</CardTitle><CardDescription>优先复用带来私信、体检和预约的内容结构。</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>内容</TableHead><TableHead>校区</TableHead><TableHead className="text-right">有效分</TableHead></TableRow></TableHeader>
              <TableBody>
                {topContent.map((task) => (
                  <TableRow key={task.id}><TableCell><p className="max-w-[420px] truncate font-medium">{task.suggestedTitle}</p><p className="text-xs text-[var(--muted-foreground)]">{task.contentType}</p></TableCell><TableCell>{task.campus}</TableCell><TableCell className="text-right font-semibold">{task.effectiveness}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>低效内容</CardTitle><CardDescription>不是删掉，而是明确下一轮如何改 CTA 和承接。</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {lowPerformanceContent.map((task) => (
              <div key={task.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-start justify-between gap-3"><p className="font-medium">{task.suggestedTitle}</p><Badge tone="amber">{task.contentType}</Badge></div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{task.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>校区线索排行</CardTitle><CardDescription>用于校区负责人跟进与资源分配。</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>校区</TableHead><TableHead>线索</TableHead><TableHead>预约</TableHead></TableRow></TableHeader>
              <TableBody>
                {campusRows.map((row) => <TableRow key={row.campus}><TableCell>{row.campus}</TableCell><TableCell>{row.leads}</TableCell><TableCell>{row.bookings}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>内容类型表现</CardTitle><CardDescription>从内容类型直接看私信、体检、预约和有效分。</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>内容类型</TableHead><TableHead>发布</TableHead><TableHead>私信</TableHead><TableHead>体检</TableHead><TableHead>预约</TableHead><TableHead>有效分</TableHead></TableRow></TableHeader>
              <TableBody>
                {contentTypeRows.map((row) => (
                  <TableRow key={row.type}><TableCell>{row.type}</TableCell><TableCell>{row.tasks}</TableCell><TableCell>{row.dm}</TableCell><TableCell>{row.assessments}</TableCell><TableCell>{row.bookings}</TableCell><TableCell>{row.score}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>各账号完成率</CardTitle><CardDescription>执行缺口会反向影响线索池和邀约量。</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {accounts.map((account) => {
              const completion = Math.round((account.weekPublished / Math.max(account.weekExpected, 1)) * 100);
              return (
                <div key={account.id} className="rounded-lg border border-[var(--border)] bg-white p-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-medium">{account.name}</p><Badge tone={completion >= 90 ? "green" : completion >= 75 ? "amber" : "red"}>{completion}%</Badge></div>
                  <Progress value={completion} className="mt-3" />
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{account.campus} · {account.type === "teacher" ? "老师主账号" : "家长视角号"} · A 类 {account.leads.aLevel}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>下周动作建议</CardTitle><CardDescription>复盘结果必须回到下一周任务派发。</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {nextWeekActions.map((action) => (
              <div key={action.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-center gap-2"><Badge tone="green">{action.campus}</Badge><Badge tone="blue">{action.owner}</Badge><Badge tone="amber">优先级 {action.score}</Badge></div>
                <h3 className="mt-3 font-semibold">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{action.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>下周放大方向</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-[var(--muted-foreground)]">放大“体检转化”“提问笔记”和三升四定位课 CTA，优先复制 TOP 内容结构。</CardContent></Card>
        <Card><CardHeader><CardTitle>下周停止方向</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-[var(--muted-foreground)]">暂停互动高但无私信的泛资料内容，除非补充评论关键词和私信承接。</CardContent></Card>
        <Card><CardHeader><CardTitle>需要校区配合</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-[var(--muted-foreground)]">人和校区补齐发布素材；北岸校区优先处理已体检未预约；凯德校区准备小升初开放日名额。</CardContent></Card>
      </section>
    </AppShell>
  );
}
