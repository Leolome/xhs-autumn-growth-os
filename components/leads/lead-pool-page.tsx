"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Download, FileUp, MessageSquarePlus, Pencil, Plus } from "lucide-react";

import { appendLeadActivity, saveLead, setLeadIntent, setLeadStage } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { campuses, leadStageOrder, stageLabels } from "@/lib/constants";
import { downloadCsv, parseCsv } from "@/lib/csv";
import { bucketToIntentLevel, bucketToIntentScore, getIntentBucketTone, intentBucketLabels, intentLevelToBucket } from "@/lib/intent";
import type { UserContext } from "@/lib/auth/types";
import type { Account, Booking, Campus, IntentBucket, Lead, LeadActivity, LeadStage, XhsNote } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const intentBuckets: IntentBucket[] = ["high", "medium", "low"];

function emptyLead(initialAccounts: Account[], initialNotes: XhsNote[]): Lead {
  const now = new Date().toISOString();
  return {
    id: `lead-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    parentNickname: "",
    studentGrade: "",
    region: "",
    campus: "礼嘉",
    sourceAccountId: initialAccounts[0]?.id ?? "",
    sourceNoteId: initialNotes[0]?.id ?? "",
    painPoints: [],
    intentScore: 60,
    intentLevel: "C",
    stage: "new",
    owner: "",
    nextAction: "先微信了解孩子年级和当前问题",
    nextFollowUpAt: now.slice(0, 16),
    notes: "",
    latestActivity: "新线索待跟进",
    latestActivityAt: now,
    activities: [],
  };
}

function bucketLabel(bucket: IntentBucket) {
  return intentBucketLabels[bucket];
}

function getActivityPayload(lead: Lead, formData: FormData): LeadActivity {
  const now = new Date().toISOString();
  return {
    id: `activity-${lead.id}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    at: now,
    actor: String(formData.get("actor") ?? lead.owner ?? "未分配"),
    action: String(formData.get("action") ?? "跟进"),
    note: String(formData.get("note") ?? ""),
  };
}

export function LeadPoolPage({
  initialLeads,
  initialAccounts,
  initialNotes,
  initialBookings,
  user,
}: {
  initialLeads: Lead[];
  initialAccounts: Account[];
  initialNotes: XhsNote[];
  initialBookings: Booking[];
  user?: UserContext;
}) {
  const [leadItems, setLeadItems] = useState(initialLeads);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activityLead, setActivityLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState<LeadStage>("new");
  const [campus, setCampus] = useState("全部校区");
  const [grade, setGrade] = useState("全部年级");
  const [intentBucket, setIntentBucket] = useState("全部热度");
  const [owner, setOwner] = useState("全部跟进人");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();
  const importRef = useRef<HTMLInputElement | null>(null);

  const grades = useMemo(
    () => Array.from(new Set(leadItems.map((lead) => lead.studentGrade).filter(Boolean))),
    [leadItems],
  );
  const owners = useMemo(
    () => Array.from(new Set(leadItems.map((lead) => lead.owner).filter(Boolean))),
    [leadItems],
  );

  const selectedLeads = useMemo(
    () =>
      leadItems.filter(
        (lead) =>
          lead.stage === stage &&
          (campus === "全部校区" || lead.campus === campus) &&
          (grade === "全部年级" || lead.studentGrade === grade) &&
          (intentBucket === "全部热度" || intentLevelToBucket(lead.intentLevel) === intentBucket) &&
          (owner === "全部跟进人" || lead.owner === owner),
      ),
    [campus, grade, intentBucket, leadItems, owner, stage],
  );

  const selectedLead = selectedLeads.find((lead) => lead.id === selectedLeadId) ?? selectedLeads[0] ?? null;

  function changeLeadStage(leadId: string, nextStage: LeadStage) {
    const now = new Date().toISOString();
    setLeadItems((items) =>
      items.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: nextStage,
              updatedAt: now,
              latestActivity: `阶段更新为 ${stageLabels[nextStage]}`,
              latestActivityAt: now,
            }
          : lead,
      ),
    );

    startTransition(() => {
      void setLeadStage(leadId, nextStage).then((result) => {
        if (!result.ok) setMessage(`阶段更新失败：${result.error}`);
      });
    });
  }

  function changeLeadIntent(leadId: string, bucket: IntentBucket) {
    const nextIntent = bucketToIntentLevel(bucket);
    const nextScore = bucketToIntentScore(bucket);
    setLeadItems((items) =>
      items.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              intentLevel: nextIntent,
              intentScore: nextScore,
              updatedAt: new Date().toISOString(),
            }
          : lead,
      ),
    );

    startTransition(() => {
      void setLeadIntent(leadId, nextIntent, nextScore).then((result) => {
        if (!result.ok) setMessage(`意向热度更新失败：${result.error}`);
      });
    });
  }

  function submitLead(formData: FormData) {
    if (!editingLead) return;
    const bucket = String(formData.get("intentBucket") ?? "medium") as IntentBucket;
    const next: Lead = {
      ...editingLead,
      updatedAt: new Date().toISOString(),
      parentNickname: String(formData.get("parentNickname") ?? ""),
      studentGrade: String(formData.get("studentGrade") ?? ""),
      region: String(formData.get("region") ?? ""),
      campus: String(formData.get("campus") ?? "礼嘉") as Campus,
      sourceAccountId: String(formData.get("sourceAccountId") ?? ""),
      sourceNoteId: String(formData.get("sourceNoteId") ?? ""),
      painPoints: String(formData.get("painPoints") ?? "")
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      intentScore: bucketToIntentScore(bucket),
      intentLevel: bucketToIntentLevel(bucket),
      stage: String(formData.get("stage") ?? "new") as LeadStage,
      owner: String(formData.get("owner") ?? ""),
      nextAction: String(formData.get("nextAction") ?? ""),
      nextFollowUpAt: String(formData.get("nextFollowUpAt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      latestActivity: editingLead.latestActivity || "已更新线索信息",
      latestActivityAt: editingLead.latestActivityAt || new Date().toISOString(),
      activities: editingLead.activities,
    };

    if (!next.parentNickname || !next.studentGrade || !next.owner) {
      setMessage("请先填好家长昵称、孩子年级和跟进人。");
      return;
    }

    setLeadItems((items) => (items.some((lead) => lead.id === next.id) ? items.map((lead) => (lead.id === next.id ? next : lead)) : [next, ...items]));
    setSelectedLeadId(next.id);

    startTransition(() => {
      void saveLead(next).then((result) => {
        setMessage(
          result.ok
            ? result.fallback
              ? "当前是演示模式，这条线索已在页面更新。"
              : "线索已经保存。"
            : `保存失败：${result.error}`,
        );
        if (result.ok) setEditingLead(null);
      });
    });
  }

  function submitActivity(formData: FormData) {
    if (!activityLead) return;
    const activity = getActivityPayload(activityLead, formData);
    const nextAction = activity.action === "已邀约" ? "等待家长回复时间" : activityLead.nextAction;

    setLeadItems((items) =>
      items.map((lead) =>
        lead.id === activityLead.id
          ? {
              ...lead,
              latestActivity: `${activity.action}：${activity.note}`,
              latestActivityAt: activity.at,
              nextAction,
              activities: [activity, ...lead.activities],
            }
          : lead,
      ),
    );

    startTransition(() => {
      void appendLeadActivity(activityLead.id, activity).then((result) => {
        setMessage(
          result.ok
            ? result.fallback
              ? "当前是演示模式，这条跟进记录只更新了页面。"
              : "跟进记录已经保存。"
            : `保存失败：${result.error}`,
        );
        if (result.ok) setActivityLead(null);
      });
    });
  }

  function exportLeads() {
    downloadCsv(
      "家长线索.csv",
      leadItems.map((lead) => ({
        家长昵称: lead.parentNickname,
        孩子年级: lead.studentGrade,
        区域: lead.region,
        意向校区: lead.campus,
        来源账号ID: lead.sourceAccountId,
        来源笔记ID: lead.sourceNoteId,
        核心痛点: lead.painPoints.join("、"),
        意向热度: bucketLabel(intentLevelToBucket(lead.intentLevel)),
        线索阶段: stageLabels[lead.stage],
        跟进人: lead.owner,
        下次跟进时间: lead.nextFollowUpAt,
        下一步动作: lead.nextAction,
        备注: lead.notes ?? "",
        最近跟进: lead.latestActivity,
      })),
    );
  }

  async function importLeads(file: File) {
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      setMessage("CSV 没有读到有效内容，请检查模板。");
      return;
    }

    const now = new Date().toISOString();
    const imported: Lead[] = [];
    const failures: string[] = [];

    for (const row of rows) {
      const nickname = row["家长昵称"] ?? row.parentNickname ?? "";
      const studentGrade = row["孩子年级"] ?? row.studentGrade ?? "";
      const ownerName = row["跟进人"] ?? row.owner ?? "";
      if (!nickname || !studentGrade || !ownerName) {
        failures.push(`第 ${row.__row} 行缺少家长昵称/孩子年级/跟进人`);
        continue;
      }

      const heat = row["意向热度"] ?? row.intentBucket ?? row["意向等级"] ?? "中意向";
      const bucket =
        heat.includes("高") || heat === "A" || heat === "B"
          ? "high"
          : heat.includes("低") || heat === "D" || heat === "F"
            ? "low"
            : "medium";

      const next: Lead = {
        id: `lead-import-${Date.now()}-${row.__row}`,
        createdAt: now,
        updatedAt: now,
        parentNickname: nickname,
        studentGrade,
        region: row["区域"] ?? row.region ?? "",
        campus: (row["意向校区"] ?? row.campus ?? "礼嘉") as Campus,
        sourceAccountId: row["来源账号ID"] ?? row.sourceAccountId ?? initialAccounts[0]?.id ?? "",
        sourceNoteId: row["来源笔记ID"] ?? row.sourceNoteId ?? initialNotes[0]?.id ?? "",
        painPoints: String(row["核心痛点"] ?? row.painPoints ?? "")
          .split(/[、,，]/)
          .map((item) => item.trim())
          .filter(Boolean),
        intentScore: bucketToIntentScore(bucket),
        intentLevel: bucketToIntentLevel(bucket),
        stage: leadStageOrder.find((item) => stageLabels[item] === row["线索阶段"]) ?? "new",
        owner: ownerName,
        nextAction: row["下一步动作"] ?? row.nextAction ?? "先私信了解情况",
        nextFollowUpAt: row["下次跟进时间"] ?? row.nextFollowUpAt ?? now,
        notes: row["备注"] ?? row.notes ?? "",
        latestActivity: row["最近跟进"] ?? "CSV 导入线索，待补首次沟通",
        latestActivityAt: now,
        activities: [],
      };

      imported.push(next);
    }

    if (imported.length) {
      setLeadItems((items) => [...imported, ...items]);
      setSelectedLeadId(imported[0].id);
      for (const lead of imported) {
        await saveLead(lead);
      }
    }

    setMessage(
      failures.length
        ? `导入 ${imported.length} 条，失败 ${failures.length} 条：${failures.slice(0, 3).join("；")}`
        : `已导入 ${imported.length} 条线索。`,
    );
    if (importRef.current) importRef.current.value = "";
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="家长线索"
        description="这页只回答两件事：哪些家长最值得跟进，下一步该做什么。意向统一改成低 / 中 / 高，更直观。"
        action={
          <>
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importLeads(file);
              }}
            />
            <Button variant="outline" onClick={() => importRef.current?.click()} disabled={isPending}>
              <FileUp data-icon="inline-start" />
              导入线索
            </Button>
            <Button variant="outline" onClick={exportLeads}>
              <Download data-icon="inline-start" />
              导出线索
            </Button>
            <Button onClick={() => setEditingLead(emptyLead(initialAccounts, initialNotes))}>
              <Plus data-icon="inline-start" />
              新增线索
            </Button>
          </>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {leadStageOrder.map((item) => {
          const count = leadItems.filter((lead) => lead.stage === item).length;
          return (
            <button
              key={item}
              onClick={() => setStage(item)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                stage === item ? "border-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]",
              )}
            >
              <p className="text-sm font-medium">{stageLabels[item]}</p>
              <p className="mt-2 text-2xl font-semibold">{count}</p>
            </button>
          );
        })}
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <FilterSelect label="校区" value={campus} onChange={setCampus} options={["全部校区", ...campuses]} />
          <FilterSelect label="年级" value={grade} onChange={setGrade} options={["全部年级", ...grades]} />
          <FilterSelect
            label="意向热度"
            value={intentBucket}
            onChange={setIntentBucket}
            options={["全部热度", ...intentBuckets]}
            optionLabels={{ high: "高意向", medium: "中意向", low: "低意向" }}
          />
          <FilterSelect label="跟进人" value={owner} onChange={setOwner} options={["全部跟进人", ...owners]} />
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setCampus("全部校区");
                setGrade("全部年级");
                setIntentBucket("全部热度");
                setOwner("全部跟进人");
              }}
            >
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>{stageLabels[stage]}</CardTitle>
            <CardDescription>卡片里只保留老师做决定最需要的信息。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {selectedLeads.length ? (
              selectedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  accounts={initialAccounts}
                  notes={initialNotes}
                  active={lead.id === selectedLeadId}
                  onSelect={() => setSelectedLeadId(lead.id)}
                  onStageChange={changeLeadStage}
                  onIntentChange={changeLeadIntent}
                  onEdit={setEditingLead}
                  onAddActivity={setActivityLead}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                当前筛选条件下暂无线索，可以新增一条或导入 CSV。
              </div>
            )}
          </CardContent>
        </Card>

        {selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            accounts={initialAccounts}
            notes={initialNotes}
            bookings={initialBookings.filter((booking) => booking.leadId === selectedLead.id)}
          />
        ) : null}
      </section>

      <Dialog open={Boolean(editingLead)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的线索内容不会保留。") && setEditingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLead?.parentNickname ? "编辑线索" : "新增线索"}</DialogTitle>
            <DialogDescription>这里录入老师真实会维护的信息，意向只分低 / 中 / 高。</DialogDescription>
          </DialogHeader>
          {editingLead ? (
            <form action={submitLead} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="家长昵称">
                  <input name="parentNickname" defaultValue={editingLead.parentNickname} className={inputClass} />
                </FormField>
                <FormField label="孩子年级">
                  <input name="studentGrade" defaultValue={editingLead.studentGrade} className={inputClass} placeholder="如 新初一" />
                </FormField>
                <FormField label="区域">
                  <input name="region" defaultValue={editingLead.region} className={inputClass} />
                </FormField>
                <FormField label="意向校区">
                  <select name="campus" defaultValue={editingLead.campus} className={inputClass}>
                    {campuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="来源账号">
                  <select name="sourceAccountId" defaultValue={editingLead.sourceAccountId} className={inputClass}>
                    {initialAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="来源笔记">
                  <select name="sourceNoteId" defaultValue={editingLead.sourceNoteId} className={inputClass}>
                    {initialNotes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.title}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="意向热度">
                  <select name="intentBucket" defaultValue={intentLevelToBucket(editingLead.intentLevel)} className={inputClass}>
                    {intentBuckets.map((item) => (
                      <option key={item} value={item}>
                        {bucketLabel(item)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="线索阶段">
                  <select name="stage" defaultValue={editingLead.stage} className={inputClass}>
                    {leadStageOrder.map((item) => (
                      <option key={item} value={item}>
                        {stageLabels[item]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="跟进人">
                  <input name="owner" defaultValue={editingLead.owner} className={inputClass} />
                </FormField>
                <FormField label="下次跟进时间">
                  <input name="nextFollowUpAt" type="datetime-local" defaultValue={editingLead.nextFollowUpAt.slice(0, 16)} className={inputClass} />
                </FormField>
                <FormField label="核心痛点" className="md:col-span-2">
                  <input name="painPoints" defaultValue={editingLead.painPoints.join("、")} className={inputClass} />
                </FormField>
                <FormField label="下一步动作" className="md:col-span-2">
                  <textarea name="nextAction" defaultValue={editingLead.nextAction} className={textareaClass} />
                </FormField>
                <FormField label="备注" className="md:col-span-2">
                  <textarea name="notes" defaultValue={editingLead.notes} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存线索"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activityLead)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的跟进记录不会保留。") && setActivityLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加跟进记录</DialogTitle>
            <DialogDescription>{activityLead?.parentNickname} 的时间线会同步更新到线索详情里。</DialogDescription>
          </DialogHeader>
          <form action={submitActivity} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="跟进人">
                <input name="actor" defaultValue={activityLead?.owner} className={inputClass} />
              </FormField>
              <FormField label="动作">
                <input name="action" defaultValue="微信跟进" className={inputClass} />
              </FormField>
              <FormField label="跟进内容" className="md:col-span-2">
                <textarea name="note" className={textareaClass} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存记录"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  optionLabels,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  optionLabels?: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LeadCard({
  lead,
  accounts,
  notes,
  active,
  onSelect,
  onStageChange,
  onIntentChange,
  onEdit,
  onAddActivity,
}: {
  lead: Lead;
  accounts: Account[];
  notes: XhsNote[];
  active: boolean;
  onSelect: () => void;
  onStageChange: (leadId: string, stage: LeadStage) => void;
  onIntentChange: (leadId: string, bucket: IntentBucket) => void;
  onEdit: (lead: Lead) => void;
  onAddActivity: (lead: Lead) => void;
}) {
  const account = accounts.find((item) => item.id === lead.sourceAccountId);
  const note = notes.find((item) => item.id === lead.sourceNoteId);
  const bucket = intentLevelToBucket(lead.intentLevel);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-white p-4 text-left transition-colors",
        active ? "border-[var(--primary)] bg-[var(--secondary)]/40" : "border-[var(--border)] hover:bg-[var(--muted)]/70",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{lead.parentNickname}</h3>
            <Badge tone={getIntentBucketTone(bucket)}>{bucketLabel(bucket)}</Badge>
            <Badge tone="blue">{lead.studentGrade}</Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {lead.region} · 意向校区 {lead.campus} · 跟进人 {lead.owner}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAddActivity(lead);
            }}
          >
            <MessageSquarePlus data-icon="inline-start" />
            跟进
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(lead);
            }}
          >
            <Pencil data-icon="inline-start" />
            编辑
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-[var(--primary)]">{lead.nextAction}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {lead.painPoints.map((point) => (
          <Badge key={point} tone="muted">
            {point}
          </Badge>
        ))}
      </div>

      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <p><span className="text-[var(--muted-foreground)]">来源账号：</span>{account?.name ?? "手动录入"}</p>
        <p><span className="text-[var(--muted-foreground)]">来源笔记：</span>{note?.title ?? "线下扫码 / 手动录入"}</p>
      </div>

      <p className="mt-2 text-sm">
        <span className="text-[var(--muted-foreground)]">最近跟进：</span>
        {formatDateTime(lead.latestActivityAt)}
      </p>
      <p className="mt-3 rounded-md bg-white/80 px-3 py-2 text-sm text-[var(--muted-foreground)]">{lead.latestActivity}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <FilterSelect
          label="线索阶段"
          value={lead.stage}
          onChange={(value) => onStageChange(lead.id, value as LeadStage)}
          options={leadStageOrder}
          optionLabels={stageLabels}
        />
        <FilterSelect
          label="意向热度"
          value={bucket}
          onChange={(value) => onIntentChange(lead.id, value as IntentBucket)}
          options={intentBuckets}
          optionLabels={{ high: "高意向", medium: "中意向", low: "低意向" }}
        />
      </div>
    </button>
  );
}

function LeadDetail({
  lead,
  accounts,
  notes,
  bookings,
}: {
  lead: Lead;
  accounts: Account[];
  notes: XhsNote[];
  bookings: Booking[];
}) {
  const sourceAccount = accounts.find((account) => account.id === lead.sourceAccountId);
  const sourceNote = notes.find((note) => note.id === lead.sourceNoteId);
  const bucket = intentLevelToBucket(lead.intentLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle>线索详情</CardTitle>
        <CardDescription>把来源、最近跟进、邀约情况和下一步动作放在一起看。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-[var(--secondary)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{lead.parentNickname}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{lead.studentGrade} · {lead.campus}</p>
            </div>
            <Badge tone={getIntentBucketTone(bucket)}>{bucketLabel(bucket)}</Badge>
          </div>
          <p className="mt-3 text-sm">下次跟进：{formatDateTime(lead.nextFollowUpAt)}</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{lead.nextAction}</p>
          {lead.notes ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">备注：{lead.notes}</p> : null}
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <p><span className="text-[var(--muted-foreground)]">来源账号：</span>{sourceAccount?.name ?? "手动录入"}</p>
          <p><span className="text-[var(--muted-foreground)]">来源笔记：</span>{sourceNote?.title ?? "线下扫码 / 手动录入"}</p>
          <p><span className="text-[var(--muted-foreground)]">核心痛点：</span>{lead.painPoints.join("、") || "待补充"}</p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium">关联邀约</p>
          <div className="mt-2 grid gap-2">
            {bookings.length ? (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-md border border-[var(--border)] bg-white p-3 text-sm">
                  <p className="font-medium">{booking.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {formatDateTime(booking.scheduledAt)} · {booking.eventType} · {booking.campus}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">下一步：{booking.nextAction}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-3 text-sm text-[var(--muted-foreground)]">
                暂无关联邀约。
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {lead.activities.length ? (
            lead.activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-[var(--primary)] pl-3">
                <p className="text-sm font-medium">{activity.action} · {activity.actor}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{formatDateTime(activity.at)}</p>
                <p className="mt-1 text-sm leading-6">{activity.note}</p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-4 text-sm text-[var(--muted-foreground)]">
              暂无完整跟进时间线。
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
