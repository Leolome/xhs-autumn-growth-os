# Deployment Checklist

这份文档用于 Phase 5：Netlify 正式部署前检查。

## 1. Supabase

1. 创建 Supabase 项目。
2. 执行迁移：

```bash
supabase db push
```

3. 导入示例数据：

```bash
pnpm seed
```

4. 如需正式登录，再补：

```bash
pnpm auth:create-user --email=admin@example.com --password=ChangeMe123! --name=运营管理员 --role=admin
```

## 2. 本地环境

创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_REQUIRED=false
AUTH_MOCK_NAME=内部运营管理员
AUTH_MOCK_ROLE=admin
AUTH_MOCK_CAMPUS=
APP_BASE_URL=http://127.0.0.1:3000
NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=
```

说明：

- 没有 Supabase 公共变量时，页面仍能走 mock fallback。
- 没有开启 `AUTH_REQUIRED` 时，系统用内部演示用户运行。
- `SUPABASE_SERVICE_ROLE_KEY` 不是应用部署硬门槛，但 seed、auth 建号脚本、worker 需要它。

## 3. 登录与权限检查

正式上线前建议完成：

1. 至少创建 1 个管理员用户。
2. 至少创建 1 个校区负责人或老师用户。
3. 为这些用户补齐 `user_profiles`。
4. 设置 `AUTH_REQUIRED=true`。
5. 确认未登录访问业务页会跳转 `/login`。
6. 确认校区账号只能看到自己校区的数据。

## 4. Netlify 环境变量

在 Netlify Site Settings -> Environment Variables 中配置：

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
AUTH_REQUIRED
```

如果你要从本地或 GitHub Actions 直接发版，再额外准备：

```txt
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

生产环境建议：

```txt
AUTH_REQUIRED=true
```

安全边界：

- 浏览器端只能使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` 只用于 seed、worker、建号脚本等受信场景
- 不要把 service role key 传到客户端组件、页面 props 或 CSV 导出中

## 5. 构建与部署检查

本地先跑：

```bash
pnpm deploy:check
pnpm lint
pnpm build
pnpm smoke:routes
```

正式部署前再跑一次严格检查：

```bash
pnpm deploy:check -- --strict
```

健康检查接口：

```txt
/api/health
```

## 6. 路由烟测

建议检查：

```txt
/dashboard
/accounts
/calendar
/crawler
/koc-tasks
/benchmarks
/lead-pool
/invitations
/login
/api/health
```

说明：

- `/review` 已重定向到 `/dashboard`
- `pnpm smoke:routes` 会额外检查 `/review` 的重定向结果

## 7. 本地 Netlify 发版

先确认已经配置：

```txt
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

然后：

```bash
pnpm netlify:deploy-preview
pnpm netlify:deploy-production
```

这两个命令会顺序执行：

1. `deploy:check`
2. `netlify deploy --build`

production 模式会自动走严格检查和 `--prod`。

## 8. GitHub Actions

仓库已补齐：

```txt
.github/workflows/netlify-deploy.yml
netlify.toml
app/api/health/route.ts
scripts/check-deploy-readiness.ts
scripts/smoke-routes.ts
scripts/deploy-netlify.ts
```

需要的 GitHub Secrets：

```txt
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
AUTH_REQUIRED
```

## 9. 当前仍可能阻塞正式上线的条件

如果下面任一项未完成，系统就还处于“可部署准备完成，但未正式发版”的状态：

- 没有 `NETLIFY_AUTH_TOKEN`
- 没有 `NETLIFY_SITE_ID`
- Netlify 环境变量未配置
- Supabase 迁移未执行
- `AUTH_REQUIRED=true` 还没准备好

## 10. 合规边界

系统仅用于内部内容复盘、线索管理、线下邀约和秋季转化，不提供自动点赞、自动评论、自动私信、绕验证或伪装家长推荐能力。
