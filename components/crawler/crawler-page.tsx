"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Clock3, Download, Play, Plus, RefreshCcw } from "lucide-react";

import { saveAccountSnapshot, saveNoteSnapshot } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import type { UserContext } from "@/lib/auth/types";
import type { Account, AccountSnapshot, CrawlError, CrawlRun, CrawlTarget, DataSource, NoteSnapshot, XhsNote } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const dataSources: DataSource[] = ["manual", "csv", "crawler"];
const dataSourceLabels: Record<DataSource, string> = {
  crawler: "系统采集",
  manual: "手动补录",
  csv: "CSV 导入",
};
const crawlErrorLabels: Record<CrawlError["errorType"], string> = {
  timeout: "采集超时",
  blocked: "访问受限",
  parse_error: "解析失败",
  not_found: "目标不存在",
  network_error: "网络错误",
  unknown: "未知错误",
};
const crawlRunStatusLabels: Record<CrawlRun["status"], string> = {
  success: "成功",
  partial: "部分成功",
  partial_failed: "部分失败",
  failed: "失败",
};

function getWeekRangeLabel(isoDate: string) {
  const current = new Date(isoDate);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  const end = new Date(current);
  end.setDate(current.getDate() + 6);
  return `${current.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`;
}

function addSevenDays(isoDate: string) {
  const value = new Date(isoDate);
  value.setDate(value.getDate() + 7);
  return value.toISOString();
}

export function CrawlerPage({
  accounts,
  xhsNotes,
  crawlTargets,
  crawlRuns,
  crawlErrors,
  accountSnapshots,
  noteSnapshots,
  user,
}: {
  accounts: Account[];
  xhsNotes: XhsNote[];
  crawlTargets: CrawlTarget[];
  crawlRuns: CrawlRun[];
  crawlErrors: CrawlError[];
  accountSnapshots: AccountSnapshot[];
  noteSnapshots: NoteSnapshot[];
  user?: UserContext;
}) {
  const [targetItems, setTargetItems] = useState(crawlTargets);
  const [runItems, setRunItems] = useState(crawlRuns);
  const [errorItems, setErrorItems] = useState(crawlErrors);
  const [accountSnapshotItems, setAccountSnapshotItems] = useState(accountSnapshots);
  const [noteSnapshotItems, setNoteSnapshotItems] = useState(noteSnapshots);
  const [accountSnapshotForm, setAccountSnapshotForm] = useState<AccountSnapshot | null>(null);
  const [noteSnapshotForm, setNoteSnapshotForm] = useState<NoteSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const latestRun = runItems[0];
  const activeTargets = targetItems.filter((target) => target.status === "active");
  const accountCaptureDates = [...new Set(accountSnapshotItems.map((snapshot) => snapshot.capturedAt))].sort((a, b) => b.localeCompare(a));
  const noteCaptureDates = [...new Set(noteSnapshotItems.map((snapshot) => snapshot.capturedAt))].sort((a, b) => b.localeCompare(a));
  const latestCaptureAt = accountCaptureDates[0] ?? new Date().toISOString();
  const previousCaptureAt = accountCaptureDates[1];
  const latestNoteCaptureAt = noteCaptureDates[0] ?? latestCaptureAt;
  const previousNoteCaptureAt = noteCaptureDates[1];
  const nextRunAt = targetItems.map((target) => target.nextCrawledAt).filter(Boolean).sort()[0] ?? addSevenDays(latestCaptureAt);
  const weekLabel = getWeekRangeLabel(latestCaptureAt);
  const successRate = latestRun ? Math.round((latestRun.successCount / Math.max(latestRun.targetCount, 1)) * 100) : 0;

  const accountGrowth = accountSnapshotItems
    .filter((snapshot) => snapshot.capturedAt === latestCaptureAt)
    .map((latest) => {
      const previous = accountSnapshotItems.find(
        (snapshot) => snapshot.accountId === latest.accountId && snapshot.capturedAt === previousCaptureAt,
      );
      const account = accounts.find((item) => item.id === latest.accountId);
      return {
        accountName: account?.name ?? latest.accountId,
        followers: latest.followers - (previous?.followers ?? latest.followers),
        engagement: latest.totalEngagement - (previous?.totalEngagement ?? latest.totalEngagement),
        source: latest.source,
      };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 8);

  const noteGrowth = noteSnapshotItems
    .filter((snapshot) => snapshot.capturedAt === latestNoteCaptureAt)
    .map((latest) => {
      const previous = noteSnapshotItems.find(
        (snapshot) => snapshot.noteId === latest.noteId && snapshot.capturedAt === previousNoteCaptureAt,
      );
      const note = xhsNotes.find((item) => item.id === latest.noteId);
      return {
        noteId: latest.noteId,
        title: note?.title ?? latest.noteId,
        interactions:
          latest.likes +
          latest.saves +
          latest.comments -
          ((previous?.likes ?? latest.likes) + (previous?.saves ?? latest.saves) + (previous?.comments ?? latest.comments)),
        source: latest.source,
      };
    })
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 8);

  function newAccountSnapshot(): AccountSnapshot {
    const now = new Date().toISOString();
    return {
      id: `account-snapshot-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      accountId: accounts[0]?.id ?? "",
      capturedAt: now,
      followers: 0,
      totalEngagement: 0,
      posts: 0,
      source: "manual",
      note: "",
    };
  }

  function newNoteSnapshot(): NoteSnapshot {
    const now = new Date().toISOString();
    return {
      id: `note-snapshot-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      noteId: xhsNotes[0]?.id ?? "",
      capturedAt: now,
      likes: 0,
      saves: 0,
      comments: 0,
      source: "manual",
      note: "",
    };
  }

  function startWeeklyCrawl() {
    const now = new Date().toISOString();
    const failedTargets = targetItems.filter((target) => target.status === "manual").slice(0, 2);
    const successCount = Math.max(activeTargets.length - failedTargets.length, 0);
    const newRun: CrawlRun = {
      id: `run-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      finishedAt: now,
      status: failedTargets.length ? "partial_failed" : "success",
      targetCount: activeTargets.length,
      successCount,
      failedCount: failedTargets.length,
      source: "crawler",
    };

    const newErrors = failedTargets.map<CrawlError>((target, index) => ({
      id: `crawl-error-${Date.now()}-${index}`,
      createdAt: now,
      updatedAt: now,
      runId: newRun.id,
      targetId: target.id,
      url: target.url,
      errorType: "timeout",
      message: "本周采集时主页超时，请在下方先补录，或等待下次周采。",
      resolved: false,
    }));

    setRunItems((items) => [newRun, ...items]);
    setErrorItems((items) => [...newErrors, ...items]);
    setTargetItems((items) =>
      items.map((target) =>
        target.status === "active"
          ? { ...target, lastCrawledAt: now, nextCrawledAt: addSevenDays(now), updatedAt: now }
          : target,
      ),
    );
    setMessage(
      failedTargets.length
        ? "已发起本周采集。大部分目标已完成，失败目标已经记录到下方，可直接补录。"
        : "已发起本周采集。当前页面已生成一条新的周采记录。",
    );
  }

  function submitAccountSnapshot(formData: FormData) {
    if (!accountSnapshotForm) return;
    const next: AccountSnapshot = {
      ...accountSnapshotForm,
      updatedAt: new Date().toISOString(),
      accountId: String(formData.get("accountId")),
      capturedAt: String(formData.get("capturedAt")),
      followers: Number(formData.get("followers")),
      totalEngagement: Number(formData.get("totalEngagement")),
      posts: Number(formData.get("posts")),
      source: String(formData.get("source")) as DataSource,
      note: String(formData.get("note")),
    };
    if (!next.accountId || !next.capturedAt) {
      setMessage("请填写账号和采集时间。");
      return;
    }
    setAccountSnapshotItems((items) => [next, ...items.filter((item) => item.id !== next.id)]);
    startTransition(() => {
      void saveAccountSnapshot(next).then((result) => {
        setMessage(
          result.ok ? (result.fallback ? "账号周数据已在演示模式保存。" : "账号周数据已保存。") : `保存失败：${result.error}`,
        );
        if (result.ok) setAccountSnapshotForm(null);
      });
    });
  }

  function submitNoteSnapshot(formData: FormData) {
    if (!noteSnapshotForm) return;
    const next: NoteSnapshot = {
      ...noteSnapshotForm,
      updatedAt: new Date().toISOString(),
      noteId: String(formData.get("noteId")),
      capturedAt: String(formData.get("capturedAt")),
      likes: Number(formData.get("likes")),
      saves: Number(formData.get("saves")),
      comments: Number(formData.get("comments")),
      source: String(formData.get("source")) as DataSource,
      note: String(formData.get("note")),
    };
    if (!next.noteId || !next.capturedAt) {
      setMessage("请填写笔记和采集时间。");
      return;
    }
    setNoteSnapshotItems((items) => [next, ...items.filter((item) => item.id !== next.id)]);
    startTransition(() => {
      void saveNoteSnapshot(next).then((result) => {
        setMessage(
          result.ok ? (result.fallback ? "笔记周数据已在演示模式保存。" : "笔记周数据已保存。") : `保存失败：${result.error}`,
        );
        if (result.ok) setNoteSnapshotForm(null);
      });
    });
  }

  function exportSnapshots() {
    downloadCsv(
      "账号每周数据.csv",
      accountSnapshotItems.map((snapshot) => ({
        账号: accounts.find((account) => account.id === snapshot.accountId)?.name ?? snapshot.accountId,
        采集时间: formatDateTime(snapshot.capturedAt),
        粉丝数: snapshot.followers,
        总获赞收藏: snapshot.totalEngagement,
        发帖数: snapshot.posts,
        数据来源: dataSourceLabels[snapshot.source],
        备注: snapshot.note ?? "",
      })),
    );
    downloadCsv(
      "笔记每周数据.csv",
      noteSnapshotItems.map((snapshot) => ({
        笔记: xhsNotes.find((note) => note.id === snapshot.noteId)?.title ?? snapshot.noteId,
        采集时间: formatDateTime(snapshot.capturedAt),
        点赞: snapshot.likes,
        收藏: snapshot.saves,
        评论: snapshot.comments,
        数据来源: dataSourceLabels[snapshot.source],
        备注: snapshot.note ?? "",
      })),
    );
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="每周数据"
        description="按整周管理公开数据。管理者可以在这里发起本周采集、看失败原因，并在需要时直接补录。"
        action={
          <>
            <Button variant="outline" onClick={exportSnapshots}>
              <Download data-icon="inline-start" />
              导出周数据
            </Button>
            <Button variant="outline" onClick={() => setNoteSnapshotForm(newNoteSnapshot())}>
              <Plus data-icon="inline-start" />
              补录笔记
            </Button>
            <Button variant="outline" onClick={() => setAccountSnapshotForm(newAccountSnapshot())}>
              <Plus data-icon="inline-start" />
              补录账号
            </Button>
            <Button onClick={startWeeklyCrawl}>
              <Play data-icon="inline-start" />
              开始本周采集
            </Button>
          </>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">本周采集周期</p>
            <p className="mt-2 text-xl font-semibold">{weekLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">本周覆盖目标</p>
            <p className="mt-2 text-3xl font-semibold">{activeTargets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">最近一次成功率</p>
            <p className="mt-2 text-3xl font-semibold">{successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">下次计划采集</p>
            <p className="mt-2 text-lg font-semibold">{formatDateTime(nextRunAt)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>本周采集控制台</CardTitle>
                <CardDescription>每周抓一次。点击上方按钮后，本周的账号和笔记目标会进入一次完整采集。</CardDescription>
              </div>
              <Button variant="outline" onClick={startWeeklyCrawl}>
                <RefreshCcw data-icon="inline-start" />
                重新跑本周
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg bg-[var(--secondary)] p-4">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Clock3 className="size-4" />
                <span>最近一次采集：{latestRun ? formatDateTime(latestRun.finishedAt) : "暂无记录"}</span>
              </div>
              <p className="mt-2 text-sm leading-6">
                当前页以管理者视角为主。这里先做“直接发起本周采集 + 查看结果 + 手动补录”的闭环，真实 Worker 接入后会在这里真正触发。
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>采集目标</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>上次采集</TableHead>
                    <TableHead>下次采集</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetItems.slice(0, 12).map((target) => {
                    const account = accounts.find((item) => item.id === target.accountId);
                    return (
                      <TableRow key={target.id}>
                        <TableCell>{account?.name ?? target.url}</TableCell>
                        <TableCell>
                          {target.targetType === "account" || target.targetType === "profile"
                            ? "账号主页"
                            : target.targetType === "benchmark"
                              ? "参考账号"
                              : "笔记链接"}
                        </TableCell>
                        <TableCell>
                          <Badge tone={target.status === "active" ? "green" : target.status === "manual" ? "amber" : "slate"}>
                            {target.status === "active" ? "正常采集" : target.status === "manual" ? "需补录" : "暂停"}
                          </Badge>
                        </TableCell>
                        <TableCell>{target.lastCrawledAt ? formatDateTime(target.lastCrawledAt) : "未采集"}</TableCell>
                        <TableCell>{target.nextCrawledAt ? formatDateTime(target.nextCrawledAt) : "待安排"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>失败记录</CardTitle>
            <CardDescription>如果本周没抓到，就在这里看原因，然后直接补录，不让页面卡死。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {errorItems.length ? (
              errorItems.slice(0, 8).map((error) => (
                <div key={error.id} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="text-red-700" />
                  <div>
                    <p className="text-sm font-medium">{crawlErrorLabels[error.errorType]}</p>
                    <p className="text-xs leading-5 text-red-800">{error.message}</p>
                    {error.url ? <p className="mt-1 text-xs text-red-700">{error.url}</p> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                暂无失败记录。
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>账号本周变化</CardTitle>
            <CardDescription>看每个账号这一周粉丝和赞藏变化，来源支持系统采集 / 手动 / CSV。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账号</TableHead>
                  <TableHead>粉丝变化</TableHead>
                  <TableHead>赞藏变化</TableHead>
                  <TableHead>来源</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountGrowth.map((row) => (
                  <TableRow key={row.accountName}>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell>{row.followers >= 0 ? `+${row.followers}` : row.followers}</TableCell>
                    <TableCell>{row.engagement >= 0 ? `+${row.engagement}` : row.engagement}</TableCell>
                    <TableCell>
                      <Badge tone={row.source === "manual" ? "amber" : row.source === "csv" ? "blue" : "green"}>
                        {dataSourceLabels[row.source]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>笔记本周变化</CardTitle>
            <CardDescription>看这周哪些笔记带来了更多互动，失败时可以直接在本页补。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>笔记</TableHead>
                  <TableHead>互动变化</TableHead>
                  <TableHead>来源</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noteGrowth.map((row) => (
                  <TableRow key={row.noteId}>
                    <TableCell className="max-w-[420px] truncate">{row.title}</TableCell>
                    <TableCell>{row.interactions >= 0 ? `+${row.interactions}` : row.interactions}</TableCell>
                    <TableCell>
                      <Badge tone={row.source === "csv" ? "blue" : row.source === "manual" ? "amber" : "green"}>
                        {dataSourceLabels[row.source]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近采集批次</CardTitle>
            <CardDescription>用来确认这一周到底有没有真正跑过。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次时间</TableHead>
                  <TableHead>结果</TableHead>
                  <TableHead>成功</TableHead>
                  <TableHead>失败</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runItems.slice(0, 6).map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.finishedAt)}</TableCell>
                    <TableCell>
                      <Badge tone={run.status === "success" ? "green" : run.status === "failed" ? "red" : "amber"}>
                        {crawlRunStatusLabels[run.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.successCount}</TableCell>
                    <TableCell>{run.failedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本周要补什么</CardTitle>
            <CardDescription>被标成“需补录”的目标，说明这周最好先手工补上。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {targetItems.filter((target) => target.status === "manual").length ? (
              targetItems
                .filter((target) => target.status === "manual")
                .slice(0, 6)
                .map((target) => {
                  const account = accounts.find((item) => item.id === target.accountId);
                  return (
                    <div key={target.id} className="rounded-lg border border-[var(--border)] bg-white p-3 text-sm">
                      <p className="font-medium">{account?.name ?? target.url}</p>
                      <p className="mt-1 text-[var(--muted-foreground)]">{target.targetType === "note" ? "先补笔记数据" : "先补账号数据"}</p>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                当前没有必须手工补录的目标。
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(accountSnapshotForm)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的账号数据不会保留。") && setAccountSnapshotForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动补录账号周数据</DialogTitle>
            <DialogDescription>用于本周采集失败后，管理者直接补账号粉丝、赞藏和发帖数。</DialogDescription>
          </DialogHeader>
          {accountSnapshotForm ? (
            <form action={submitAccountSnapshot} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="账号">
                  <select name="accountId" defaultValue={accountSnapshotForm.accountId} className={inputClass}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="采集时间">
                  <input type="datetime-local" name="capturedAt" defaultValue={accountSnapshotForm.capturedAt.slice(0, 16)} className={inputClass} />
                </FormField>
                <FormField label="粉丝数">
                  <input type="number" min={0} name="followers" defaultValue={accountSnapshotForm.followers} className={inputClass} />
                </FormField>
                <FormField label="总获赞收藏">
                  <input type="number" min={0} name="totalEngagement" defaultValue={accountSnapshotForm.totalEngagement} className={inputClass} />
                </FormField>
                <FormField label="发帖数">
                  <input type="number" min={0} name="posts" defaultValue={accountSnapshotForm.posts} className={inputClass} />
                </FormField>
                <FormField label="数据来源">
                  <select name="source" defaultValue={accountSnapshotForm.source} className={inputClass}>
                    {dataSources.map((source) => (
                      <option key={source} value={source}>
                        {dataSourceLabels[source]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="备注" className="md:col-span-2">
                  <textarea name="note" defaultValue={accountSnapshotForm.note} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中" : "保存账号数据"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noteSnapshotForm)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的笔记数据不会保留。") && setNoteSnapshotForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动补录笔记周数据</DialogTitle>
            <DialogDescription>用于本周没抓到笔记互动时，直接补点赞、收藏和评论。</DialogDescription>
          </DialogHeader>
          {noteSnapshotForm ? (
            <form action={submitNoteSnapshot} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="笔记">
                  <select name="noteId" defaultValue={noteSnapshotForm.noteId} className={inputClass}>
                    {xhsNotes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.title}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="采集时间">
                  <input type="datetime-local" name="capturedAt" defaultValue={noteSnapshotForm.capturedAt.slice(0, 16)} className={inputClass} />
                </FormField>
                <FormField label="点赞">
                  <input type="number" min={0} name="likes" defaultValue={noteSnapshotForm.likes} className={inputClass} />
                </FormField>
                <FormField label="收藏">
                  <input type="number" min={0} name="saves" defaultValue={noteSnapshotForm.saves} className={inputClass} />
                </FormField>
                <FormField label="评论">
                  <input type="number" min={0} name="comments" defaultValue={noteSnapshotForm.comments} className={inputClass} />
                </FormField>
                <FormField label="数据来源">
                  <select name="source" defaultValue={noteSnapshotForm.source} className={inputClass}>
                    {dataSources.map((source) => (
                      <option key={source} value={source}>
                        {dataSourceLabels[source]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="备注" className="md:col-span-2">
                  <textarea name="note" defaultValue={noteSnapshotForm.note} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中" : "保存笔记数据"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
