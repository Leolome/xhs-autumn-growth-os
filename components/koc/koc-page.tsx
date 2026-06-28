import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { today } from "@/data";
import { taskStatusLabels, taskStatusTone } from "@/lib/constants";
import type { UserContext } from "@/lib/auth/types";
import type { Account, GrowthTask } from "@/lib/types";

function getWeekLabel(date: string) {
  const current = new Date(`${date}T00:00:00`);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  const end = new Date(current);
  end.setDate(current.getDate() + 6);
  return `${current.toISOString().slice(5, 10)} - ${end.toISOString().slice(5, 10)}`;
}

export function KocPage({ accounts, tasks, user }: { accounts: Account[]; tasks: GrowthTask[]; user?: UserContext }) {
  const kocAccounts = accounts.filter((account) => account.type === "koc");
  const currentWeekLabel = getWeekLabel(today);

  return (
    <AppShell user={user}>
      <PageHeader
        title="家长号建议"
        description="这里不做复杂协同，只给每个校区的家长视角号明确 4 条可执行建议：标题、笔记类型、文案、标签、是否已发。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kocAccounts.map((account) => {
          const weeklyTasks = tasks
            .filter((task) => task.assignedAccountId === account.id && getWeekLabel(task.assignedDate) === currentWeekLabel)
            .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));

          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{account.name}</CardTitle>
                    <CardDescription>{account.campus} · {account.owner}</CardDescription>
                  </div>
                  <Badge tone="green">{weeklyTasks.length}/4</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-lg bg-[var(--secondary)] p-3 text-sm">
                  <p className="font-medium">这周建议方向</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">{account.positioning}</p>
                </div>

                {weeklyTasks.length ? (
                  weeklyTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-[var(--border)] bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="slate">{task.assignedDate.slice(5)}</Badge>
                        <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
                      </div>
                      <p className="mt-3 font-medium">{task.suggestedTitle}</p>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{task.contentType}</p>
                      <p className="mt-3 text-sm leading-6">{task.hook}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.requiredAssets.map((asset) => (
                          <Badge key={asset} tone="muted">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-3 text-sm">
                        <span className="text-[var(--muted-foreground)]">是否发布：</span>
                        {["published", "data_filled", "reviewed"].includes(task.status) ? "已发布" : "未发布"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-foreground)]">
                    这周还没给这个号排建议，去“发什么”页面补上即可。
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>合规边界</CardTitle>
          <CardDescription>家长号只做真实自然表达，不做任何伪装互动。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "不伪装成已报名家长推荐机构",
            "不诱导自动点赞、评论、私信",
            "不公开学生隐私和联系方式",
            "不夸大提分，不踩竞品",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg bg-[var(--muted)] p-3 text-sm">
              <ShieldCheck className="mt-0.5 text-[var(--primary)]" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
