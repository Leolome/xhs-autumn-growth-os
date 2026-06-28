"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus } from "lucide-react";

import { saveBenchmarkAccount } from "@/app/actions/status-actions";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, inputClass, textareaClass } from "@/components/ui/form-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserContext } from "@/lib/auth/types";
import type { BenchmarkAccount, BenchmarkNote } from "@/lib/types";

function createBlankBenchmark(): BenchmarkAccount {
  const now = new Date().toISOString();
  return {
    id: `benchmark-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    name: "",
    avatarUrl: "",
    category: "",
    positioning: "",
    url: "",
    learnings: [],
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

export function BenchmarksPage({
  benchmarkAccounts,
  benchmarkNotes,
  forbiddenCases,
  user,
}: {
  benchmarkAccounts: BenchmarkAccount[];
  benchmarkNotes: BenchmarkNote[];
  forbiddenCases: string[];
  user?: UserContext;
}) {
  const [accounts, setAccounts] = useState(benchmarkAccounts);
  const [editingAccount, setEditingAccount] = useState<BenchmarkAccount | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitAccount(formData: FormData) {
    if (!editingAccount) return;
    const next: BenchmarkAccount = {
      ...editingAccount,
      updatedAt: new Date().toISOString(),
      name: String(formData.get("name") ?? ""),
      avatarUrl: String(formData.get("avatarUrl") ?? ""),
      category: String(formData.get("category") ?? ""),
      positioning: String(formData.get("positioning") ?? ""),
      url: String(formData.get("url") ?? ""),
      learnings: String(formData.get("learnings") ?? "")
        .split(/[、；;,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (!next.name || !next.url || !next.positioning) {
      setMessage("请先填好账号名称、链接和账号画像。");
      return;
    }

    setAccounts((items) => (items.some((item) => item.id === next.id) ? items.map((item) => (item.id === next.id ? next : item)) : [next, ...items]));

    startTransition(() => {
      void saveBenchmarkAccount(next).then((result) => {
        setMessage(
          result.ok
            ? result.fallback
              ? "当前是演示模式，这条参考账号已在页面更新。"
              : "参考账号已经保存。"
            : `保存失败：${result.error}`,
        );
        if (result.ok) setEditingAccount(null);
      });
    });
  }

  return (
    <AppShell user={user}>
      <PageHeader
        title="参考账号"
        description="这里只保留老师真的会回看的内容：账号长什么样、适合学什么、有哪些不能碰的边界。"
        action={
          <Button onClick={() => setEditingAccount(createBlankBenchmark())}>
            <Plus data-icon="inline-start" />
            新增参考账号
          </Button>
        }
      />

      {message ? <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>参考库</CardTitle>
          <CardDescription>对标不是照抄，而是知道什么值得学、什么一定不能学。</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="accounts">
            <TabsList>
              <TabsTrigger value="accounts">参考账号</TabsTrigger>
              <TabsTrigger value="notes">参考笔记</TabsTrigger>
              <TabsTrigger value="forbidden">不能做的事</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-sm font-semibold text-[var(--primary)]"
                          style={getAvatarStyle(account.avatarUrl)}
                        >
                          {!account.avatarUrl ? account.name.slice(0, 2) : null}
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{account.category}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditingAccount(account)}>
                        <Pencil data-icon="inline-start" />
                        编辑
                      </Button>
                    </div>

                    <p className="mt-4 text-sm leading-6">{account.positioning}</p>
                    <a href={account.url} className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                      打开小红书主页
                      <ExternalLink data-icon="inline-end" />
                    </a>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {account.learnings.map((learning) => (
                        <Badge key={learning} tone="muted">
                          {learning}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="notes" className="grid gap-3">
              {benchmarkNotes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <Badge tone="slate">{note.accountName}</Badge>
                    <h3 className="mt-3 font-semibold">{note.title}</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <p className="text-sm"><span className="text-[var(--muted-foreground)]">开头怎么写：</span>{note.hook}</p>
                      <p className="text-sm"><span className="text-[var(--muted-foreground)]">封面怎么做：</span>{note.coverFormula}</p>
                      <p className="text-sm"><span className="text-[var(--muted-foreground)]">评论区信号：</span>{note.commentInsight}</p>
                      <p className="text-sm"><span className="text-[var(--muted-foreground)]">我们能怎么改：</span>{note.reusableDirection}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="forbidden" className="grid gap-3 md:grid-cols-2">
              {forbiddenCases.map((item) => (
                <div key={item} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {item}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingAccount)} onOpenChange={(open) => !open && window.confirm("确认关闭？未保存的内容不会保留。") && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount?.name ? "编辑参考账号" : "新增参考账号"}</DialogTitle>
            <DialogDescription>支持头像、名称、链接、账号画像和可学点编辑。</DialogDescription>
          </DialogHeader>
          {editingAccount ? (
            <form action={submitAccount} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="账号名称">
                  <input name="name" defaultValue={editingAccount.name} className={inputClass} />
                </FormField>
                <FormField label="账号类型">
                  <input name="category" defaultValue={editingAccount.category} className={inputClass} placeholder="如 本地英语老师 / 家长博主" />
                </FormField>
                <FormField label="头像链接" className="md:col-span-2">
                  <input name="avatarUrl" defaultValue={editingAccount.avatarUrl} className={inputClass} />
                </FormField>
                <FormField label="小红书链接" className="md:col-span-2">
                  <input name="url" defaultValue={editingAccount.url} className={inputClass} />
                </FormField>
                <FormField label="账号画像" className="md:col-span-2">
                  <textarea name="positioning" defaultValue={editingAccount.positioning} className={textareaClass} />
                </FormField>
                <FormField label="可学点" className="md:col-span-2">
                  <textarea
                    name="learnings"
                    defaultValue={editingAccount.learnings.join("；")}
                    className={textareaClass}
                    placeholder="用分号或顿号分开"
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存参考账号"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
