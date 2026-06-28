"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, inputClass } from "@/components/ui/form-field";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ hasSupabase }: { hasSupabase: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const next = searchParams.get("next") || "/dashboard";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("请填写邮箱和密码。");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase || !hasSupabase) {
      setMessage("当前未配置 Supabase，系统处于内部演示模式。");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`登录失败：${error.message}`);
        return;
      }

      router.replace(next);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录增长驾驶舱</CardTitle>
        <CardDescription>使用 Supabase Auth 账号进入校区运营系统。</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="邮箱 *">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </FormField>
          <FormField label="密码 *">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
            />
          </FormField>
          {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
          {!hasSupabase ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              当前未配置 Supabase 环境变量，登录仅作为预上线占位；请直接返回系统查看 mock fallback。
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending || !hasSupabase}>
              <LogIn data-icon="inline-start" />
              {isPending ? "登录中" : "登录"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              返回系统
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
