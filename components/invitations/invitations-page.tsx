"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, Download, MessageSquareQuote, Pencil, Plus } from "lucide-react";

import { saveBooking, setBookingStatus } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bookingStatusLabels, campuses, stageLabels } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { bucketToIntentLevel, bucketToIntentScore, getIntentBucketTone, intentBucketLabels, intentLevelToBucket } from "@/lib/intent";
import type { UserContext } from "@/lib/auth/types";
import type { Booking, BookingStatus, Campus, Lead } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const bookingStatuses = Object.keys(bookingStatusLabels) as BookingStatus[];
const eventTypes: Booking["eventType"][] = ["定位课", "开放日", "体验课", "家长沟通"];

const bookingStatusToLeadStage: Partial<Record<BookingStatus, Lead["stage"]>> = {
  booked: "booked",
  arrived: "arrived",
  feedback_done: "arrived",
  strong_intent: "strong_intent",
  registered: "converted",
  not_now: "nurturing",
};

const bookingStatusToIntentBucket: Partial<Record<BookingStatus, "high" | "medium" | "low">> = {
  strong_intent: "high",
  registered: "high",
  not_now: "medium",
};

export function InvitationsPage({
  initialBookings,
  initialLeads,
  user,
}: {
  initialBookings: Booking[];
  initialLeads: Lead[];
  user?: UserContext;
}) {
  const [bookingItems, setBookingItems] = useState(initialBookings);
  const [leadItems, setLeadItems] = useState(initialLeads);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const invitationQueue = useMemo(
    () => leadItems.filter((lead) => ["to_invite", "assessed", "group_joined", "strong_intent"].includes(lead.stage)),
    [leadItems],
  );

  function emptyBooking(leadId = invitationQueue[0]?.id ?? leadItems[0]?.id ?? ""): Booking {
    const now = new Date().toISOString();
    const lead = leadItems.find((item) => item.id === leadId);
    return {
      id: `booking-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      leadId,
      campus: lead?.campus ?? "礼嘉",
      eventType: "定位课",
      title: "开学前英语能力定位课",
      scheduledAt: now,
      receptionTeacher: "",
      capacity: 8,
      bookedCount: 1,
      status: "to_invite",
      script: "先确认孩子年级和当前问题，再邀请家长参加一次线下定位沟通。",
      nextAction: "确认家长能来的时间，并发校区位置",
    };
  }

  function syncLeadFromBookingStatus(leadId: string, status: BookingStatus) {
    const nextStage = bookingStatusToLeadStage[status];
    const nextBucket = bookingStatusToIntentBucket[status];
    setLeadItems((items) =>
      items.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: nextStage ?? lead.stage,
              intentLevel: nextBucket ? bucketToIntentLevel(nextBucket) : lead.intentLevel,
              intentScore: nextBucket ? bucketToIntentScore(nextBucket) : lead.intentScore,
              updatedAt: new Date().toISOString(),
              latestActivity: `邀约状态更新为 ${bookingStatusLabels[status]}`,
              latestActivityAt: new Date().toISOString(),
            }
          : lead,
      ),
    );
  }

  function changeBookingStatus(booking: Booking, status: BookingStatus) {
    setBookingItems((items) =>
      items.map((item) => (item.id === booking.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)),
    );
    syncLeadFromBookingStatus(booking.leadId, status);

    startTransition(() => {
      void setBookingStatus(booking.id, booking.leadId, status).then((result) => {
        if (!result.ok) setMessage(`状态更新失败：${result.error}`);
      });
    });
  }

  function submitBooking(formData: FormData) {
    if (!editingBooking) return;
    const leadId = String(formData.get("leadId") ?? "");
    const next: Booking = {
      ...editingBooking,
      updatedAt: new Date().toISOString(),
      leadId,
      campus: String(formData.get("campus") ?? "礼嘉") as Campus,
      eventType: String(formData.get("eventType") ?? "定位课") as Booking["eventType"],
      title: String(formData.get("title") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      receptionTeacher: String(formData.get("receptionTeacher") ?? ""),
      capacity: Number(formData.get("capacity") ?? 8),
      bookedCount: Number(formData.get("bookedCount") ?? 1),
      status: String(formData.get("status") ?? "to_invite") as BookingStatus,
      noShowReason: String(formData.get("noShowReason") ?? "") || undefined,
      arrivalFeedback: String(formData.get("arrivalFeedback") ?? "") || undefined,
      recommendedClass: String(formData.get("recommendedClass") ?? "") || undefined,
      script: String(formData.get("script") ?? ""),
      nextAction: String(formData.get("nextAction") ?? ""),
    };

    if (!next.leadId || !next.title || !next.scheduledAt) {
      setMessage("请先填好关联线索、活动标题和预约时间。");
      return;
    }

    setBookingItems((items) => (items.some((item) => item.id === next.id) ? items.map((item) => (item.id === next.id ? next : item)) : [next, ...items]));
    syncLeadFromBookingStatus(next.leadId, next.status);

    startTransition(() => {
      void saveBooking(next).then((saveResult) => {
        if (!saveResult.ok) {
          setMessage(`保存失败：${saveResult.error}`);
          return;
        }
        void setBookingStatus(next.id, next.leadId, next.status);
        setMessage(saveResult.fallback ? "当前是演示模式，这条邀约已在页面更新。" : "邀约已经保存。");
        setEditingBooking(null);
      });
    });
  }

  function exportBookings() {
    downloadCsv(
      "到店邀约.csv",
      bookingItems.map((booking) => {
        const lead = leadItems.find((item) => item.id === booking.leadId);
        return {
          关联线索: lead?.parentNickname ?? booking.leadId,
          校区: booking.campus,
          活动类型: booking.eventType,
          活动标题: booking.title,
          预约时间: formatDateTime(booking.scheduledAt),
          接待老师: booking.receptionTeacher ?? "",
          邀约状态: bookingStatusLabels[booking.status],
          家长热度: lead ? intentBucketLabels[intentLevelToBucket(lead.intentLevel)] : "",
          未到原因: booking.noShowReason ?? "",
          到课反馈: booking.arrivalFeedback ?? "",
          推荐班型: booking.recommendedClass ?? "",
          下一步动作: booking.nextAction,
        };
      }),
    );
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="到店邀约"
        description="这里的目标很简单：今天该约谁，约完结果怎么样，到课之后下一步怎么跟。"
        action={
          <>
            <Button variant="outline" onClick={exportBookings}>
              <Download data-icon="inline-start" />
              导出邀约
            </Button>
            <Button onClick={() => setEditingBooking(emptyBooking())}>
              <Plus data-icon="inline-start" />
              新增邀约
            </Button>
          </>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>今天先约谁</CardTitle>
            <CardDescription>优先处理高意向和已经体检、已经进群但还没落预约的家长。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {invitationQueue.length ? (
              invitationQueue.map((lead) => {
                const bucket = intentLevelToBucket(lead.intentLevel);
                return (
                  <div key={lead.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{lead.parentNickname}</p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {lead.studentGrade} · {lead.campus} · {lead.painPoints.join("、")}
                        </p>
                      </div>
                      <Badge tone={getIntentBucketTone(bucket)}>{intentBucketLabels[bucket]}</Badge>
                    </div>
                    <p className="mt-3 text-sm">{lead.nextAction}</p>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">当前阶段：{stageLabels[lead.stage]}</p>
                    <Button size="sm" className="mt-3 w-full" onClick={() => setEditingBooking(emptyBooking(lead.id))}>
                      记录邀约
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
                今天没有待邀约线索。
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>预约排期</CardTitle>
              <CardDescription>定位课、开放日、体验课和家长沟通统一在这里排。</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排期</TableHead>
                    <TableHead>校区</TableHead>
                    <TableHead>接待老师</TableHead>
                    <TableHead>已约人数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingItems.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <p className="font-medium">{booking.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatDateTime(booking.scheduledAt)} · {booking.eventType}
                        </p>
                      </TableCell>
                      <TableCell>{booking.campus}</TableCell>
                      <TableCell>{booking.receptionTeacher || "待分配"}</TableCell>
                      <TableCell>{booking.bookedCount}/{booking.capacity}</TableCell>
                      <TableCell>
                        <select
                          value={booking.status}
                          onChange={(event) => changeBookingStatus(booking, event.target.value as BookingStatus)}
                          className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs"
                        >
                          {bookingStatuses.map((value) => (
                            <option key={value} value={value}>
                              {bookingStatusLabels[value]}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setEditingBooking(booking)}>
                          <Pencil data-icon="inline-start" />
                          编辑
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            {bookingItems.map((booking) => {
              const lead = leadItems.find((item) => item.id === booking.leadId);
              const bucket = lead ? intentLevelToBucket(lead.intentLevel) : null;
              return (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquareQuote data-icon="inline-start" />
                      邀约详情
                    </CardTitle>
                    <CardDescription>{lead?.parentNickname ?? "手动录入线索"} · {booking.campus}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{booking.eventType}</Badge>
                      <Badge tone="slate">{bookingStatusLabels[booking.status]}</Badge>
                      {bucket ? <Badge tone={getIntentBucketTone(bucket)}>{intentBucketLabels[bucket]}</Badge> : null}
                    </div>
                    <p className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6">{booking.script}</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <p><span className="text-[var(--muted-foreground)]">预约时间：</span>{formatDateTime(booking.scheduledAt)}</p>
                      <p><span className="text-[var(--muted-foreground)]">未到原因：</span>{booking.noShowReason ?? "无"}</p>
                      <p><span className="text-[var(--muted-foreground)]">到课反馈：</span>{booking.arrivalFeedback ?? "待记录"}</p>
                      <p><span className="text-[var(--muted-foreground)]">推荐班型：</span>{booking.recommendedClass ?? "待补充"}</p>
                      <p><span className="text-[var(--muted-foreground)]">下一步动作：</span>{booking.nextAction}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock />
            今日转化看板
          </CardTitle>
          <CardDescription>预约、到课、反馈、转强意向和报名都在这里快速看。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {[
            { label: "待邀约", value: invitationQueue.length },
            { label: "已预约", value: bookingItems.filter((booking) => booking.status === "booked").length },
            { label: "已到课", value: bookingItems.filter((booking) => booking.status === "arrived").length },
            { label: "已报名", value: bookingItems.filter((booking) => booking.status === "registered").length },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--muted-foreground)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingBooking)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的邀约内容不会保留。") && setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBooking?.createdAt === editingBooking?.updatedAt ? "新增邀约" : "编辑邀约"}</DialogTitle>
            <DialogDescription>邀约状态变化后，会尽量同步更新对应线索的阶段和热度。</DialogDescription>
          </DialogHeader>
          {editingBooking ? (
            <form action={submitBooking} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="关联线索">
                  <select name="leadId" defaultValue={editingBooking.leadId} className={inputClass}>
                    {leadItems.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.parentNickname} · {lead.studentGrade}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="校区">
                  <select name="campus" defaultValue={editingBooking.campus} className={inputClass}>
                    {campuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="活动类型">
                  <select name="eventType" defaultValue={editingBooking.eventType} className={inputClass}>
                    {eventTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="预约时间">
                  <input type="datetime-local" name="scheduledAt" defaultValue={editingBooking.scheduledAt.slice(0, 16)} className={inputClass} />
                </FormField>
                <FormField label="活动标题">
                  <input name="title" defaultValue={editingBooking.title} className={inputClass} />
                </FormField>
                <FormField label="接待老师">
                  <input name="receptionTeacher" defaultValue={editingBooking.receptionTeacher} className={inputClass} />
                </FormField>
                <FormField label="容量">
                  <input type="number" min={1} name="capacity" defaultValue={editingBooking.capacity} className={inputClass} />
                </FormField>
                <FormField label="已预约人数">
                  <input type="number" min={0} name="bookedCount" defaultValue={editingBooking.bookedCount} className={inputClass} />
                </FormField>
                <FormField label="邀约状态">
                  <select name="status" defaultValue={editingBooking.status} className={inputClass}>
                    {bookingStatuses.map((item) => (
                      <option key={item} value={item}>
                        {bookingStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="未到原因">
                  <input name="noShowReason" defaultValue={editingBooking.noShowReason} className={inputClass} />
                </FormField>
                <FormField label="到课反馈" className="md:col-span-2">
                  <textarea name="arrivalFeedback" defaultValue={editingBooking.arrivalFeedback} className={textareaClass} />
                </FormField>
                <FormField label="推荐班型">
                  <input name="recommendedClass" defaultValue={editingBooking.recommendedClass} className={inputClass} />
                </FormField>
                <FormField label="下一步动作">
                  <input name="nextAction" defaultValue={editingBooking.nextAction} className={inputClass} />
                </FormField>
                <FormField label="邀约话术" className="md:col-span-2">
                  <textarea name="script" defaultValue={editingBooking.script} className={textareaClass} />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存邀约"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
