"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, ExternalLink, Eye, Pencil, Plus } from "lucide-react";

import { saveAccount } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { today } from "@/data";
import { campuses } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import type { UserContext } from "@/lib/auth/types";
import type { Account, AccountSnapshot, AccountType, Campus, GrowthTask } from "@/lib/types";
import { formatDateTime, formatNumber } from "@/lib/utils";

const accountStatusLabels: Record<Account["status"], string> = {
  active: "正常",
  paused: "暂停",
  risk: "风险提醒",
};

const accountStatusTone: Record<Account["status"], "green" | "amber" | "red"> = {
  active: "green",
  paused: "amber",
  risk: "red",
};

function createBlankAccount(): Account {
  const now = new Date().toISOString();
  return {
    id: `account-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    name: "",
    type: "teacher",
    campus: "礼嘉",
    owner: "",
    avatarUrl: "",
    profileUrl: "",
    positioning: "",
    notes: "",
    status: "active",
    followers: 0,
    totalEngagement: 0,
    posts: 0,
    lastSnapshotAt: now,
    weekExpected: 4,
    weekPublished: 0,
    dataPending: 0,
    leads: { dm: 0, assessments: 0, groups: 0, bookings: 0, aLevel: 0 },
  };
}

function getAvatarStyle(avatarUrl?: string) {
  return avatarUrl
    ? {
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;
}

function getWeekLabel(date: string) {
  const current = new Date(`${date}T00:00:00`);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  const end = new Date(current);
  end.setDate(current.getDate() + 6);
  return `${current.toISOString().slice(5, 10)} - ${end.toISOString().slice(5, 10)}`;
}

function AccountTable({
  rows,
  tasks,
  onEdit,
  onView,
}: {
  rows: Account[];
  tasks: GrowthTask[];
  onEdit: (account: Account) => void;
  onView: (account: Account) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>账号</TableHead>
            <TableHead>校区</TableHead>
            <TableHead>负责人</TableHead>
            <TableHead>这周安排</TableHead>
            <TableHead>最近三天数据</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((account) => {
            const weekTasks = tasks.filter(
              (task) => task.assignedAccountId === account.id && getWeekLabel(task.assignedDate) === getWeekLabel(today),
            );

            return (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="flex min-w-[240px] items-center gap-3">
                    <div
                      className="flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-xs font-semibold text-[var(--primary)]"
                      style={getAvatarStyle(account.avatarUrl)}
                    >
                      {!account.avatarUrl ? account.name.slice(0, 2) || "账号" : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{account.name || "未命名账号"}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {account.type === "teacher" ? "老师号" : "家长视角号"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{account.campus}</TableCell>
                <TableCell>{account.owner}</TableCell>
                <TableCell>
                  <p className="font-medium">
                    {weekTasks.length}/{account.weekExpected} 条
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{account.positioning}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatNumber(account.followers)} 粉丝</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    赞藏 {formatNumber(account.totalEngagement)} · 发帖 {account.posts}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge tone={accountStatusTone[account.status]}>{accountStatusLabels[account.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onView(account)}>
                      <Eye data-icon="inline-start" />
                      查看
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(account)}>
                      <Pencil data-icon="inline-start" />
                      编辑
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AccountsPage({
  initialAccounts,
  tasks,
  accountSnapshots,
  user,
}: {
  initialAccounts: Account[];
  tasks: GrowthTask[];
  accountSnapshots: AccountSnapshot[];
  user?: UserContext;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [editing, setEditing] = useState<Account | null>(null);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const teacherAccounts = useMemo(
    () => accounts.filter((account) => account.type === "teacher"),
    [accounts],
  );
  const kocAccounts = useMemo(() => accounts.filter((account) => account.type === "koc"), [accounts]);

  function openNew() {
    setEditing(createBlankAccount());
    setMessage("");
  }

  function submitAccount(formData: FormData) {
    if (!editing) return;
    const next: Account = {
      ...editing,
      updatedAt: new Date().toISOString(),
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "teacher") as AccountType,
      campus: String(formData.get("campus") ?? "礼嘉") as Campus,
      owner: String(formData.get("owner") ?? ""),
      avatarUrl: String(formData.get("avatarUrl") ?? ""),
      profileUrl: String(formData.get("profileUrl") ?? ""),
      positioning: String(formData.get("positioning") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "active") as Account["status"],
    };

    if (!next.name || !next.owner || !next.profileUrl) {
      setMessage("请先填好账号名称、负责人和主页链接。");
      return;
    }

    setAccounts((items) => {
      const exists = items.some((item) => item.id === next.id);
      return exists ? items.map((item) => (item.id === next.id ? next : item)) : [next, ...items];
    });

    startTransition(() => {
      void saveAccount(next).then((result) => {
        setMessage(
          result.ok
            ? result.fallback
              ? "当前是演示模式，页面里能看到更新，但不会长期保存。"
              : "账号已经保存。"
            : `保存失败：${result.error}`,
        );
        if (result.ok) setEditing(null);
      });
    });
  }

  function exportAccounts() {
    downloadCsv(
      "账号管理.csv",
      accounts.map((account) => ({
        账号名称: account.name,
        账号类型: account.type === "teacher" ? "老师号" : "家长视角号",
        校区: account.campus,
        负责人: account.owner,
        头像链接: account.avatarUrl ?? "",
        小红书主页: account.profileUrl,
        账号定位: account.positioning,
        状态: accountStatusLabels[account.status],
        备注: account.notes ?? "",
      })),
    );
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="账号管理"
        description="先把老师号和家长号收清楚。老师进来只需要看清谁负责、这周发几条、最近三天数据怎么样。"
        action={
          <>
            <Button variant="outline" onClick={exportAccounts}>
              <Download data-icon="inline-start" />
              导出账号
            </Button>
            <Button onClick={openNew}>
              <Plus data-icon="inline-start" />
              新增账号
            </Button>
          </>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">账号总数</p>
            <p className="mt-2 text-3xl font-semibold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">老师号</p>
            <p className="mt-2 text-3xl font-semibold">{teacherAccounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--muted-foreground)]">家长视角号</p>
            <p className="mt-2 text-3xl font-semibold">{kocAccounts.length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>账号列表</CardTitle>
          <CardDescription>把账号基础信息和三天数据放在一起看，不再堆一大串复杂关联项。</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teacher">
            <TabsList>
              <TabsTrigger value="teacher">老师号</TabsTrigger>
              <TabsTrigger value="koc">家长视角号</TabsTrigger>
            </TabsList>
            <TabsContent value="teacher">
              <AccountTable rows={teacherAccounts} tasks={tasks} onEdit={setEditing} onView={setDetailAccount} />
            </TabsContent>
            <TabsContent value="koc">
              <AccountTable rows={kocAccounts} tasks={tasks} onEdit={setEditing} onView={setDetailAccount} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AccountDetailDialog
        account={detailAccount}
        onClose={() => setDetailAccount(null)}
        tasks={tasks}
        snapshots={accountSnapshots}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的账号内容不会保留。") && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name ? "编辑账号" : "新增账号"}</DialogTitle>
            <DialogDescription>这里填写老师真正会维护的信息。未配置 Supabase 时会以演示模式更新页面。</DialogDescription>
          </DialogHeader>
          {editing ? (
            <form action={submitAccount} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="账号名称">
                  <input name="name" defaultValue={editing.name} className={inputClass} />
                </FormField>
                <FormField label="账号类型">
                  <select name="type" defaultValue={editing.type} className={inputClass}>
                    <option value="teacher">老师号</option>
                    <option value="koc">家长视角号</option>
                  </select>
                </FormField>
                <FormField label="所属校区">
                  <select name="campus" defaultValue={editing.campus} className={inputClass}>
                    {campuses.map((campus) => (
                      <option key={campus}>{campus}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="负责人">
                  <input name="owner" defaultValue={editing.owner} className={inputClass} />
                </FormField>
                <FormField label="头像链接" className="md:col-span-2">
                  <input name="avatarUrl" defaultValue={editing.avatarUrl} className={inputClass} placeholder="可直接贴图片链接" />
                </FormField>
                <FormField label="小红书主页链接" className="md:col-span-2">
                  <input name="profileUrl" defaultValue={editing.profileUrl} className={inputClass} />
                </FormField>
                <FormField label="状态">
                  <select name="status" defaultValue={editing.status} className={inputClass}>
                    <option value="active">正常</option>
                    <option value="paused">暂停</option>
                    <option value="risk">风险</option>
                  </select>
                </FormField>
                <FormField label="账号定位" className="md:col-span-2">
                  <textarea name="positioning" defaultValue={editing.positioning} className={textareaClass} />
                </FormField>
                <FormField label="备注" className="md:col-span-2">
                  <textarea name="notes" defaultValue={editing.notes} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存账号"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function AccountDetailDialog({
  account,
  onClose,
  tasks,
  snapshots,
}: {
  account: Account | null;
  onClose: () => void;
  tasks: GrowthTask[];
  snapshots: AccountSnapshot[];
}) {
  if (!account) return null;

  const recentSnapshots = snapshots
    .filter((snapshot) => snapshot.accountId === account.id)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, 3);
  const thisWeekTasks = tasks
    .filter((task) => task.assignedAccountId === account.id && getWeekLabel(task.assignedDate) === getWeekLabel(today))
    .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));

  const riskText =
    account.status === "risk"
      ? "最近需要留意内容节奏和主页状态，建议先稳住每周 4 条任务。"
      : account.weekPublished < account.weekExpected
        ? "本周还没发满 4 条，可以回到“发什么”页面继续补任务。"
        : "本周节奏正常。";

  return (
    <Dialog open={Boolean(account)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>账号详情</DialogTitle>
          <DialogDescription>{account.name} · {account.campus} · {account.type === "teacher" ? "老师号" : "家长视角号"}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center gap-4 rounded-xl bg-[var(--secondary)] p-4">
            <div
              className="flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--primary)]"
              style={getAvatarStyle(account.avatarUrl)}
            >
              {!account.avatarUrl ? account.name.slice(0, 2) : null}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{account.name}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{account.positioning}</p>
              <a href={account.profileUrl} className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                打开小红书主页
                <ExternalLink data-icon="inline-end" />
              </a>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="最近粉丝" value={formatNumber(account.followers)} />
            <MetricCard label="最近赞藏" value={formatNumber(account.totalEngagement)} />
            <MetricCard label="本周安排" value={`${thisWeekTasks.length}/4`} />
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
            <p className="font-medium">当前提醒</p>
            <p className="mt-2 text-[var(--muted-foreground)]">{riskText}</p>
            {account.notes ? <p className="mt-2 text-[var(--muted-foreground)]">备注：{account.notes}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-medium">这周要发什么</p>
              <div className="mt-3 grid gap-2">
                {thisWeekTasks.length ? (
                  thisWeekTasks.map((task) => (
                    <div key={task.id} className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm">
                      {task.assignedDate} · {task.suggestedTitle}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">这周还没有排任务。</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-medium">最近三次三天数据</p>
              <div className="mt-3 grid gap-2">
                {recentSnapshots.length ? (
                  recentSnapshots.map((snapshot) => (
                    <div key={snapshot.id} className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm">
                      {formatDateTime(snapshot.capturedAt)} · 粉丝 {formatNumber(snapshot.followers)} · 赞藏 {formatNumber(snapshot.totalEngagement)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">还没有三天数据。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
