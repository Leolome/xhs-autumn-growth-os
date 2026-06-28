"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Download, Eye, Pencil, Plus } from "lucide-react";

import { saveTask, setTaskStatus } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { today } from "@/data";
import { getDateRange } from "@/lib/calendar";
import { campuses, contentTypes, kocContentTypes, productPeriod, taskStatusLabels } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import type { UserContext } from "@/lib/auth/types";
import type { Account, Campus, ContentType, GrowthTask, Lead, TaskStatus, XhsNote } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const statusOrder: TaskStatus[] = ["todo", "drafting", "published", "data_filled", "reviewed"];
const publishedStatuses = new Set<TaskStatus>(["published", "data_filled", "reviewed"]);

type WeekBlock = {
  key: string;
  title: string;
  dates: string[];
};

function buildWeeks() {
  const allDates = getDateRange(productPeriod.start, productPeriod.end);
  const weeks: WeekBlock[] = [];
  for (let index = 0; index < allDates.length; index += 7) {
    const dates = allDates.slice(index, index + 7);
    weeks.push({
      key: dates[0],
      title: `${dates[0].slice(5)} - ${dates[dates.length - 1].slice(5)}`,
      dates,
    });
  }
  return weeks;
}

function getWeekKey(date: string) {
  const allWeeks = buildWeeks();
  return allWeeks.find((week) => week.dates.includes(date))?.key ?? allWeeks[0]?.key ?? today;
}

function createBlankTask(account?: Account, week?: WeekBlock): GrowthTask {
  const now = new Date().toISOString();
  return {
    id: `task-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    assignedDate: week?.dates[0] ?? today,
    assignedAccountId: account?.id ?? "",
    campus: account?.campus ?? "礼嘉",
    contentType: account?.type === "koc" ? "生活化定位内容" : "提问笔记",
    suggestedTitle: "",
    hook: "",
    requiredAssets: [],
    cta: account?.type === "koc" ? "评论交流真实问题即可。" : "评论关键词或私信领取资料。",
    complianceNote:
      account?.type === "koc"
        ? "保持真实生活化表达，不伪装家长推荐，不诱导虚假互动。"
        : "不夸大提分，不展示学生完整隐私，不承诺必然效果。",
    status: "todo",
    sourceLeadIds: [],
    metrics: { likes: 0, saves: 0, comments: 0, dm: 0, assessments: 0, bookings: 0 },
  };
}

export function CalendarPage({
  initialAccounts,
  initialTasks,
  initialNotes,
  initialLeads,
  user,
}: {
  initialAccounts: Account[];
  initialTasks: GrowthTask[];
  initialNotes: XhsNote[];
  initialLeads: Lead[];
  user?: UserContext;
}) {
  const [taskItems, setTaskItems] = useState(initialTasks);
  const [editingTask, setEditingTask] = useState<GrowthTask | null>(null);
  const [detailTask, setDetailTask] = useState<GrowthTask | null>(null);
  const [message, setMessage] = useState("");
  const [accountType, setAccountType] = useState<"teacher" | "koc">("teacher");
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccounts.find((account) => account.type === "teacher")?.id ?? "",
  );
  const [selectedWeekKey, setSelectedWeekKey] = useState(getWeekKey(today));
  const [isPending, startTransition] = useTransition();

  const weeks = useMemo(() => buildWeeks(), []);
  const accounts = useMemo(
    () => initialAccounts.filter((account) => account.type === accountType),
    [accountType, initialAccounts],
  );
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const selectedWeek = weeks.find((week) => week.key === selectedWeekKey) ?? weeks[0];
  const accountTasks = taskItems.filter((task) => task.assignedAccountId === selectedAccount?.id);
  const weekTasks = accountTasks
    .filter((task) => selectedWeek?.dates.includes(task.assignedDate))
    .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
  const todayTasks = taskItems
    .filter((task) => task.assignedDate === today && initialAccounts.find((account) => account.id === task.assignedAccountId)?.type === accountType)
    .sort((a, b) => a.assignedAccountId.localeCompare(b.assignedAccountId));

  function openNewTask() {
    setEditingTask(createBlankTask(selectedAccount, selectedWeek));
    setMessage("");
  }

  function submitTask(formData: FormData) {
    if (!editingTask) return;
    const account = initialAccounts.find((item) => item.id === String(formData.get("assignedAccountId")));
    const next: GrowthTask = {
      ...editingTask,
      updatedAt: new Date().toISOString(),
      assignedDate: String(formData.get("assignedDate")),
      assignedAccountId: String(formData.get("assignedAccountId")),
      campus: String(formData.get("campus")) as Campus,
      contentType: String(formData.get("contentType")) as ContentType,
      suggestedTitle: String(formData.get("suggestedTitle")),
      hook: String(formData.get("hook")),
      requiredAssets: String(formData.get("requiredAssets"))
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      cta: String(formData.get("cta") ?? ""),
      complianceNote: String(formData.get("complianceNote") ?? ""),
      status: String(formData.get("status")) as TaskStatus,
      sourceLeadIds: String(formData.get("sourceLeadIds") ?? "")
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (!next.assignedDate || !next.assignedAccountId || !next.suggestedTitle || !next.hook) {
      setMessage("请至少填好日期、负责账号、标题和文案。");
      return;
    }
    if (account && next.campus !== account.campus) next.campus = account.campus;

    setTaskItems((items) => (items.some((item) => item.id === next.id) ? items.map((item) => (item.id === next.id ? next : item)) : [next, ...items]));
    startTransition(() => {
      void saveTask(next).then((result) => {
        setMessage(
          result.ok
            ? result.fallback
              ? "当前是演示模式，这条任务已在页面更新。"
              : "任务已经保存。"
            : `保存失败：${result.error}`,
        );
        if (result.ok) setEditingTask(null);
      });
    });
  }

  function updateTaskStatus(task: GrowthTask, nextStatus: TaskStatus) {
    setTaskItems((items) => items.map((item) => (item.id === task.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)));
    startTransition(() => {
      void setTaskStatus(task.id, nextStatus).then((result) => {
        if (!result.ok) setMessage(`状态更新失败：${result.error}`);
      });
    });
  }

  function quickPublish(task: GrowthTask) {
    updateTaskStatus(task, publishedStatuses.has(task.status) ? "drafting" : "published");
  }

  function exportTasks() {
    downloadCsv(
      "每周发什么.csv",
      taskItems.map((task) => {
        const account = initialAccounts.find((item) => item.id === task.assignedAccountId);
        return {
          日期: task.assignedDate,
          负责账号: account?.name ?? task.assignedAccountId,
          校区: task.campus,
          账号类型: account?.type === "teacher" ? "老师号" : "家长视角号",
          笔记类型: task.contentType,
          标题: task.suggestedTitle,
          文案: task.hook,
          标签: task.requiredAssets.join("、"),
          是否发布: publishedStatuses.has(task.status) ? "已发布" : "未发布",
          任务状态: taskStatusLabels[task.status],
        };
      }),
    );
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="发什么"
        description="老师先找自己的号，再看这周 4 条要发什么。数据表现不用在这里看，统一回到“三天数据”。"
        action={
          <>
            <Button variant="outline" onClick={exportTasks}>
              <Download data-icon="inline-start" />
              导出任务
            </Button>
            <Button onClick={openNewTask}>
              <Plus data-icon="inline-start" />
              新增任务
            </Button>
          </>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <Card className="border-[var(--primary)]/20 bg-white/95">
        <CardHeader>
          <CardTitle>今天谁要发</CardTitle>
          <CardDescription>先看今天到点要发的内容，再回到下方按账号看整周安排。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {todayTasks.length ? (
            todayTasks.map((task) => {
              const account = initialAccounts.find((item) => item.id === task.assignedAccountId);
              return (
                <div key={task.id} className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{account?.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{task.suggestedTitle}</p>
                    </div>
                    <Badge tone={publishedStatuses.has(task.status) ? "green" : "amber"}>
                      {publishedStatuses.has(task.status) ? "已发布" : "待发布"}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
              今天这个类型下没有安排任务。
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>先选账号类型</CardTitle>
              <CardDescription>老师号和家长视角号分开看，避免任务混在一起。</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={accountType}
                onValueChange={(value) => {
                  const nextType = value as "teacher" | "koc";
                  const nextAccounts = initialAccounts.filter((account) => account.type === nextType);
                  setAccountType(nextType);
                  setSelectedAccountId(nextAccounts[0]?.id ?? "");
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="teacher">老师号</TabsTrigger>
                  <TabsTrigger value="koc">家长视角号</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mt-4 grid gap-2">
                {accounts.map((account) => {
                  const active = selectedAccount?.id === account.id;
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        active ? "border-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]",
                      )}
                    >
                      <p className="font-medium">{account.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{account.campus} · {account.owner}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>这两个月的周安排</CardTitle>
              <CardDescription>每周固定 4 条，点一周就能看这周要发什么。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {weeks.map((week) => {
                const count = taskItems.filter(
                  (task) => task.assignedAccountId === selectedAccount?.id && week.dates.includes(task.assignedDate),
                ).length;
                const active = week.key === selectedWeek.key;
                return (
                  <button
                    key={week.key}
                    onClick={() => setSelectedWeekKey(week.key)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      active ? "border-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{week.title}</span>
                      <Badge tone={count === 4 ? "green" : "amber"}>{count}/4</Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{selectedAccount?.name ?? "请选择账号"} · 这周要发什么</CardTitle>
                <CardDescription>
                  {selectedWeek.title} · 重点只保留标题、笔记类型、文案、标签和是否发布。
                </CardDescription>
              </div>
              <Badge tone="blue">{selectedAccount?.campus ?? "未选择校区"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {weekTasks.length ? (
              weekTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  account={selectedAccount}
                  onQuickPublish={quickPublish}
                  onStatusChange={updateTaskStatus}
                  onEdit={setEditingTask}
                  onView={setDetailTask}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted-foreground)]">
                这一周还没有安排任务，点右上角“新增任务”就能补上。
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <TaskDetailDialog
        task={detailTask}
        account={detailTask ? initialAccounts.find((account) => account.id === detailTask.assignedAccountId) : undefined}
        notes={detailTask ? initialNotes.filter((note) => note.taskId === detailTask.id) : []}
        leads={
          detailTask
            ? initialLeads.filter((lead) => detailTask.sourceLeadIds?.includes(lead.id))
            : []
        }
        onClose={() => setDetailTask(null)}
      />

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的任务内容不会保留。") && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask?.suggestedTitle ? "编辑任务" : "新增任务"}</DialogTitle>
            <DialogDescription>老师页面里只展示最重要的 5 项，其他字段保留给后续数据承接。</DialogDescription>
          </DialogHeader>
          {editingTask ? (
            <form action={submitTask} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="日期">
                  <input type="date" name="assignedDate" defaultValue={editingTask.assignedDate} className={inputClass} />
                </FormField>
                <FormField label="负责账号">
                  <select name="assignedAccountId" defaultValue={editingTask.assignedAccountId} className={inputClass}>
                    {initialAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="所属校区">
                  <select name="campus" defaultValue={editingTask.campus} className={inputClass}>
                    {campuses.map((campus) => (
                      <option key={campus}>{campus}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="笔记类型">
                  <select name="contentType" defaultValue={editingTask.contentType} className={inputClass}>
                    {[...contentTypes, ...kocContentTypes].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="标题" className="md:col-span-2">
                  <input name="suggestedTitle" defaultValue={editingTask.suggestedTitle} className={inputClass} />
                </FormField>
                <FormField label="文案" className="md:col-span-2">
                  <textarea name="hook" defaultValue={editingTask.hook} className={textareaClass} />
                </FormField>
                <FormField label="标签 / 素材" className="md:col-span-2">
                  <input name="requiredAssets" defaultValue={editingTask.requiredAssets.join("、")} className={inputClass} />
                </FormField>
                <FormField label="任务状态">
                  <select name="status" defaultValue={editingTask.status} className={inputClass}>
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>
                        {taskStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="关联来源线索，可选">
                  <input name="sourceLeadIds" defaultValue={editingTask.sourceLeadIds?.join("、")} className={inputClass} />
                </FormField>
                <FormField label="CTA（后续承接用）" className="md:col-span-2">
                  <input name="cta" defaultValue={editingTask.cta} className={inputClass} />
                </FormField>
                <FormField label="合规提醒" className="md:col-span-2">
                  <textarea name="complianceNote" defaultValue={editingTask.complianceNote} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存任务"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function TaskCard({
  task,
  account,
  onQuickPublish,
  onStatusChange,
  onEdit,
  onView,
}: {
  task: GrowthTask;
  account?: Account;
  onQuickPublish: (task: GrowthTask) => void;
  onStatusChange: (task: GrowthTask, status: TaskStatus) => void;
  onEdit: (task: GrowthTask) => void;
  onView: (task: GrowthTask) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate">{formatDate(task.assignedDate)}</Badge>
            <Badge tone={account?.type === "teacher" ? "blue" : "green"}>
              {account?.type === "teacher" ? "老师号" : "家长视角号"}
            </Badge>
            <Badge tone={publishedStatuses.has(task.status) ? "green" : "amber"}>
              {publishedStatuses.has(task.status) ? "已发布" : "未发布"}
            </Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold">{task.suggestedTitle}</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{task.contentType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(task)}>
            <Eye data-icon="inline-start" />
            查看
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            <Pencil data-icon="inline-start" />
            编辑
          </Button>
          <Button size="sm" onClick={() => onQuickPublish(task)}>
            <CheckCircle2 data-icon="inline-start" />
            {publishedStatuses.has(task.status) ? "改回未发布" : "标记已发布"}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)]">文案</p>
          <p className="mt-2 text-sm leading-6">{task.hook}</p>
        </div>
        <div className="grid gap-3">
          <div>
            <p className="text-xs font-medium text-[var(--muted-foreground)]">标签 / 素材</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.requiredAssets.length ? (
                task.requiredAssets.map((asset) => (
                  <Badge key={asset} tone="muted">
                    {asset}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-[var(--muted-foreground)]">还没填写</span>
              )}
            </div>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">任务进度</span>
            <select
              value={task.status}
              onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
              className="h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function TaskDetailDialog({
  task,
  account,
  notes,
  leads,
  onClose,
}: {
  task: GrowthTask | null;
  account?: Account;
  notes: XhsNote[];
  leads: Lead[];
  onClose: () => void;
}) {
  if (!task) return null;

  return (
    <Dialog open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>任务详情</DialogTitle>
          <DialogDescription>{account?.name} · {task.assignedDate}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          <div className="rounded-lg bg-[var(--secondary)] p-4">
            <p className="font-semibold">{task.suggestedTitle}</p>
            <p className="mt-2 text-[var(--muted-foreground)]">{task.contentType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--muted-foreground)]">文案</p>
            <p className="mt-2 leading-6">{task.hook}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--muted-foreground)]">标签 / 素材</p>
            <p className="mt-2">{task.requiredAssets.join("、") || "暂无"}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <p><span className="text-[var(--muted-foreground)]">承接动作：</span>{task.cta || "暂无"}</p>
            <p><span className="text-[var(--muted-foreground)]">任务状态：</span>{taskStatusLabels[task.status]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--muted-foreground)]">合规提醒</p>
            <p className="mt-2 leading-6">{task.complianceNote}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <p className="font-medium">关联笔记</p>
              <div className="mt-2 grid gap-2">
                {notes.length ? notes.map((note) => <p key={note.id} className="text-[var(--muted-foreground)]">{note.title}</p>) : <p className="text-[var(--muted-foreground)]">暂无</p>}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <p className="font-medium">关联线索</p>
              <div className="mt-2 grid gap-2">
                {leads.length ? leads.map((lead) => <p key={lead.id} className="text-[var(--muted-foreground)]">{lead.parentNickname} · {lead.studentGrade}</p>) : <p className="text-[var(--muted-foreground)]">暂无</p>}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
