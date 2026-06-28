import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const baseUrl = (process.env.APP_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const protectedRoutes = [
  "/dashboard",
  "/accounts",
  "/calendar",
  "/crawler",
  "/koc-tasks",
  "/benchmarks",
  "/lead-pool",
  "/invitations",
];

const publicRoutes = ["/login", "/api/health"];

type CheckResult = {
  path: string;
  ok: boolean;
  status: number;
  detail: string;
};

async function checkHtmlRoute(path: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", signal: controller.signal });
    clearTimeout(timeout);
  const location = response.headers.get("location");

    if (response.status >= 200 && response.status < 300) {
      const body = await response.text();
      const hasError =
        body.includes("Application error") ||
        body.includes("Internal Server Error") ||
        body.includes("__next_error__");

      return {
        path,
        ok: !hasError,
        status: response.status,
        detail: hasError ? "页面返回了错误内容" : "200 OK",
      };
    }

    if (response.status >= 300 && response.status < 400 && location) {
      const allowedLoginRedirect = location.includes("/login");
      const allowedDashboardRedirect = path === "/review" && location.includes("/dashboard");

      return {
        path,
        ok: allowedLoginRedirect || allowedDashboardRedirect,
        status: response.status,
        detail: `redirect -> ${location}`,
      };
    }

    return {
      path,
      ok: false,
      status: response.status,
      detail: "未命中允许的页面或重定向结果",
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      path,
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : "请求失败",
    };
  }
}

async function checkHealthRoute(path: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return {
        path,
        ok: false,
        status: response.status,
        detail: "健康检查接口不可用",
      };
    }

    const data = (await response.json()) as { ok?: boolean; mode?: string; authRequired?: boolean };
    return {
      path,
      ok: data.ok === true,
      status: response.status,
      detail: `ok=${String(data.ok)} mode=${data.mode ?? "unknown"} authRequired=${String(data.authRequired)}`,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      path,
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : "请求失败",
    };
  }
}

async function main() {
  const results: CheckResult[] = [];

  for (const path of protectedRoutes) {
    results.push(await checkHtmlRoute(path));
  }

  results.push(await checkHtmlRoute("/review"));

  for (const path of publicRoutes) {
    if (path === "/api/health") {
      results.push(await checkHealthRoute(path));
    } else {
      results.push(await checkHtmlRoute(path));
    }
  }

  console.log(`Smoke base URL: ${baseUrl}`);
  console.log("Route smoke test");
  console.log("================");

  for (const result of results) {
    const prefix = result.ok ? "OK  " : "FAIL";
    console.log(`${prefix} ${result.path} [${result.status}] ${result.detail}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("All route checks passed.");
}

main().catch((error) => {
  console.error("Smoke test failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
