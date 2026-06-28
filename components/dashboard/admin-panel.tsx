"use client";

import { useState, useTransition } from "react";
import { History, Pencil, Plus, Shield } from "lucide-react";

import { saveManagedUser, saveUserProfileAction } from "@/app/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ManagedUserInput, UserProfile } from "@/lib/auth/types";
import { roleLabels } from "@/lib/auth/types";
import { campuses } from "@/lib/constants";
import type { Account, AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function emptyManagedUser(): ManagedUserInput {
  return {
    email: "",
    password: "",
    displayName: "",
    role: "viewer",
    campus: null,
    ownerAccountIds: [],
    isActive: true,
  };
}

function profileToManagedUser(profile: UserProfile): ManagedUserInput {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
    campus: profile.campus,
    ownerAccountIds: profile.ownerAccountIds,
    isActive: profile.isActive,
  };
}

export function AdminPanel({
  initialProfiles,
  initialAuditLogs,
  accounts,
  isDemo,
}: {
  initialProfiles: UserProfile[];
  initialAuditLogs: AuditLog[];
  accounts: Account[];
  isDemo: boolean;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [message, setMessage] = useState("");
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [form, setForm] = useState<ManagedUserInput>(emptyManagedUser());
  const [isPending, startTransition] = useTransition();

  const accountLookup = new Map(accounts.map((account) => [account.id, account.name]));

  function openCreate() {
    setForm(emptyManagedUser());
    setCreatingUser(true);
    setEditingProfile(null);
    setMessage("");
  }

  function openEdit(profile: UserProfile) {
    setForm(profileToManagedUser(profile));
    setEditingProfile(profile);
    setCreatingUser(false);
    setMessage("");
  }

  function closeDialog() {
    if (isPending) return;
    setCreatingUser(false);
    setEditingProfile(null);
  }

  function applyProfile(profile: UserProfile) {
    setProfiles((current) => {
      const hasExisting = current.some((item) => item.id === profile.id);
      if (!hasExisting) return [profile, ...current];
      return current.map((item) => (item.id === profile.id ? profile : item));
    });
  }

  function submitCreate() {
    startTransition(() => {
      void saveManagedUser(form).then((result) => {
        setMessage(result.ok ? (result.fallback ? "当前为演示模式，未持久化到 Supabase。" : "用户权限已创建。") : result.error || "保存失败。");
        if (result.ok && result.profile) {
          applyProfile(result.profile);
          setAuditLogs((current) => [
            {
              id: `local-user-${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              actorId: "local",
              actorName: "当前管理员",
              actorRole: "admin",
              action: "创建或更新用户权限",
              entityType: "user_profile",
              entityId: result.profile.id,
              detail: { email: result.profile.email, role: result.profile.role },
            },
            ...current,
          ].slice(0, 10));
          closeDialog();
        }
      });
    });
  }

  function submitEdit() {
    if (!editingProfile) return;

    const nextProfile: UserProfile = {
      ...editingProfile,
      email: form.email,
      displayName: form.displayName,
      role: form.role,
      campus: form.campus,
      ownerAccountIds: form.ownerAccountIds,
      isActive: form.isActive,
      updatedAt: new Date().toISOString(),
    };

    startTransition(() => {
      void saveUserProfileAction(nextProfile).then((result) => {
        setMessage(result.ok ? (result.fallback ? "当前为演示模式，未持久化到 Supabase。" : "用户权限已更新。") : result.error || "更新失败。");
        if (result.ok && result.profile) {
          applyProfile(result.profile);
          closeDialog();
        }
      });
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>权限与校区</CardTitle>
              <CardDescription>管理员可维护登录用户、角色、校区范围和归属账号。</CardDescription>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" />
              新增用户
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {message ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
              {message}
            </div>
          ) : null}
          {isDemo ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              当前为演示模式。没有 Supabase 或未开启登录时，权限改动只用于界面演示。
            </div>
          ) : null}
          {!profiles.length ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted-foreground)]">
              还没有用户档案。可先用 `pnpm auth:create-user` 或面板里的新增用户创建第一批账号。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>校区</TableHead>
                    <TableHead>归属账号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <p className="font-medium">{profile.displayName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{profile.email}</p>
                      </TableCell>
                      <TableCell>{roleLabels[profile.role]}</TableCell>
                      <TableCell>{profile.campus ?? "全部校区"}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-sm text-[var(--muted-foreground)]">
                          {profile.ownerAccountIds.length
                            ? profile.ownerAccountIds.map((id) => accountLookup.get(id) ?? id).join("、")
                            : "未限制"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge tone={profile.isActive ? "green" : "amber"}>{profile.isActive ? "启用" : "停用"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" onClick={() => openEdit(profile)}>
                          <Pencil data-icon="inline-start" />
                          编辑
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="size-4 text-[var(--primary)]" />
            <div>
              <CardTitle>最近操作</CardTitle>
              <CardDescription>追踪账号、任务、线索、邀约、快照和权限变更。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!auditLogs.length ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted-foreground)]">
              还没有审计日志。后续保存任务、线索、邀约和权限后，这里会自动出现记录。
            </div>
          ) : (
            auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="rounded-lg border border-[var(--border)] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.action}</p>
                  <Badge tone="blue">{formatDateTime(log.createdAt)}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {log.actorName} · {log.actorRole} · {log.campus ?? "全局"}
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {log.entityType} / {log.entityId}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={creatingUser || Boolean(editingProfile)} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfile ? "编辑用户权限" : "新增登录用户"}</DialogTitle>
            <DialogDescription>
              {editingProfile ? "调整角色、校区和可管理账号。" : "会同时创建 Auth 用户和 user_profiles 记录。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <FormField label="姓名">
              <input
                className={inputClass}
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="如：礼嘉校区负责人"
              />
            </FormField>
            <FormField label="邮箱">
              <input
                className={inputClass}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </FormField>
            {!editingProfile ? (
              <FormField label="初始密码">
                <input
                  className={inputClass}
                  value={form.password ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="留空则自动生成临时密码"
                />
              </FormField>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="角色">
                <select
                  className={inputClass}
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as ManagedUserInput["role"] }))}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="校区">
                <select
                  className={inputClass}
                  value={form.campus ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      campus: event.target.value ? (event.target.value as Account["campus"]) : null,
                    }))
                  }
                >
                  <option value="">全部校区</option>
                  {campuses.map((campus) => (
                    <option key={campus} value={campus}>
                      {campus}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="归属账号 ID（逗号分隔，可选）">
              <input
                className={inputClass}
                value={form.ownerAccountIds.join(",")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ownerAccountIds: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="teacher-lijia-01,koc-beian-02"
              />
            </FormField>
            <FormField label="状态">
              <select
                className={inputClass}
                value={form.isActive ? "active" : "paused"}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "active" }))}
              >
                <option value="active">启用</option>
                <option value="paused">停用</option>
              </select>
            </FormField>
            {form.ownerAccountIds.length ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                归属账号：{form.ownerAccountIds.map((id) => accountLookup.get(id) ?? id).join("、")}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
              取消
            </Button>
            <Button type="button" onClick={editingProfile ? submitEdit : submitCreate} disabled={isPending || !form.displayName || !form.email}>
              <Shield data-icon="inline-start" />
              {isPending ? "保存中" : editingProfile ? "更新权限" : "创建用户"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
