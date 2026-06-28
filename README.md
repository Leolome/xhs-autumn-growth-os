# XHS Autumn Growth OS

重庆高途 2026 年 7-8 月小红书秋招增长驾驶舱。

当前版本已经进入内部预上线阶段，重点服务老师、校区负责人和运营同学，围绕这些问题展开：

- 今天每个老师要发什么
- 每个账号最近一周数据怎么样
- 哪些内容真的带来了私信、体检和进群
- 哪个校区线索最多
- 哪些家长最值得继续跟进
- 今天该邀约谁到线下
- 哪些到课家长更有秋季转化机会
- 本周该向领导汇报什么

系统目前覆盖：

- `Dashboard` 经营总览
- `Accounts` 账号资产
- `Calendar` 每周任务日历
- `KOC Tasks` 家长视角号建议
- `Benchmarks` 对标账号库
- `Lead Pool` 秋招蓄水池
- `Invitations` 线下邀约中心
- `Crawler` 每周公开数据

`/review` 已收口并重定向到 `/dashboard`。

## 本地启动

```bash
pnpm install
pnpm dev
```

默认地址：

```txt
http://127.0.0.1:3000
```

如果没有配置 Supabase，系统会自动回退到 mock data，方便本地演示和构建。

## 环境变量

复制 `.env.example` 为 `.env.local`，然后按需填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_REQUIRED=false
AUTH_MOCK_NAME=内部运营管理员
AUTH_MOCK_ROLE=admin
AUTH_MOCK_CAMPUS=
APP_BASE_URL=http://127.0.0.1:3000
NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`：浏览器端允许使用的公开 Supabase 变量。
- `SUPABASE_SERVICE_ROLE_KEY`：只给 seed、auth 建号脚本、worker 等受信场景使用，不进入浏览器端。
- `AUTH_REQUIRED=false`：本地演示模式，允许 mock fallback。
- `AUTH_REQUIRED=true`：正式环境建议开启，未登录用户会被引导到 `/login`。
- `NETLIFY_AUTH_TOKEN`、`NETLIFY_SITE_ID`：用于本地或 GitHub Actions 触发 Netlify 部署。

## Supabase 初始化

1. 创建 Supabase 项目。
2. 执行迁移：

```bash
supabase db push
```

3. 导入示例数据：

```bash
pnpm seed
```

## 登录、角色、校区权限

当前已经有 Phase 4 的权限骨架，支持这些角色：

```txt
admin
operator
campus_manager
teacher
viewer
```

如果要启用正式登录：

1. 先跑完所有迁移。
2. 创建 Supabase Auth 用户。
3. 同步写入 `user_profiles`。
4. 将 `AUTH_REQUIRED=true`。

辅助脚本：

```bash
pnpm auth:create-user --email=admin@example.com --password=ChangeMe123! --name=运营管理员 --role=admin
pnpm auth:create-user --email=lijiacenter@example.com --password=ChangeMe123! --name=礼嘉校区负责人 --role=campus_manager --campus=礼嘉
```

## 数据导入导出

当前支持：

- 账号导出
- 内容任务导出
- 线索池导出
- 邀约表导出
- 每周数据导出
- 线索 CSV 导入

## Worker

每周公开数据采集 Worker 独立于 Next.js 和 Netlify：

```bash
pnpm crawler:dry-run
pnpm crawler:fixture
pnpm crawler:run
```

它只做低频公开数据采集和内部复盘，不做自动点赞、自动评论、自动私信、绕验证或伪装家长推荐。

## Netlify 部署

现在 Netlify 是 Phase 5 的主部署路径。

仓库已补齐：

- `netlify.toml`
- `app/api/health/route.ts`
- `scripts/check-deploy-readiness.ts`
- `scripts/smoke-routes.ts`
- `scripts/deploy-netlify.ts`
- `.github/workflows/netlify-deploy.yml`
- `DEPLOYMENT.md`
- `.env.example`

常用命令：

```bash
pnpm deploy:check
pnpm deploy:check -- --strict
pnpm smoke:routes
pnpm netlify:status
pnpm netlify:deploy-preview
pnpm netlify:deploy-production
pnpm lint
pnpm build
```

健康检查接口：

```txt
/api/health
```

### 最短部署流程

1. 创建 Netlify site。
2. 在 Netlify Site Settings 配置：

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
AUTH_REQUIRED
```

3. 如果需要本地或 GitHub Actions 直接发版，再准备：

```txt
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

4. 本地确认：

```bash
pnpm lint
pnpm build
pnpm smoke:routes
pnpm deploy:check -- --strict
```

5. 预览部署：

```bash
pnpm netlify:deploy-preview
```

6. 正式部署：

```bash
pnpm netlify:deploy-production
```

## 常见问题

- `pnpm deploy:check -- --strict` 失败：通常是缺 `NETLIFY_AUTH_TOKEN`、`NETLIFY_SITE_ID`、Supabase 公共变量，或 `AUTH_REQUIRED` 不是 `true`。
- 页面仍是 mock data：检查 Netlify 环境变量里是否配置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- 表单提示演示模式：当前运行环境没有 Supabase 公共变量。
- `pnpm netlify:deploy-preview` 失败：通常是 Netlify token 或 site id 未配置。

## 合规边界

系统只服务于内容复盘、线索管理、线下邀约和秋季转化，不提供自动点赞、自动评论、自动私信、绕验证或伪装家长推荐能力。
