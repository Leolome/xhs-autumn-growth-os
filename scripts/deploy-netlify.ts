import { spawnSync } from "node:child_process";

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

type DeployTarget = "preview" | "production";

const target = process.argv.includes("--prod") ? "production" : "preview";

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing ${key}.`);
    process.exit(1);
  }
  return value;
}

function run(command: string, args: string[], extraEnv: Record<string, string | undefined>) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runDeploy(targetValue: DeployTarget) {
  const authToken = requireEnv("NETLIFY_AUTH_TOKEN");
  const siteId = requireEnv("NETLIFY_SITE_ID");

  const extraEnv: Record<string, string | undefined> = {
    NETLIFY_AUTH_TOKEN: authToken,
    NETLIFY_SITE_ID: siteId,
  };

  console.log(`Starting local Netlify ${targetValue} deploy flow...`);

  run("pnpm", ["deploy:check", ...(targetValue === "production" ? ["--", "--strict"] : [])], extraEnv);

  const deployArgs =
    targetValue === "production"
      ? ["dlx", "netlify-cli", "deploy", "--build", "--prod", "--json"]
      : ["dlx", "netlify-cli", "deploy", "--build", "--json"];

  run("pnpm", deployArgs, extraEnv);
}

runDeploy(target);
