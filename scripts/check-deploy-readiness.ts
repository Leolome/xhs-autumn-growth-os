import { existsSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

const strict = process.argv.includes("--strict");

const requiredFiles = [
  "netlify.toml",
  "DEPLOYMENT.md",
  "README.md",
  ".env.example",
  ".github/workflows/netlify-deploy.yml",
  "app/api/health/route.ts",
  "supabase/migrations/202607010001_initial_growth_os_schema.sql",
  "supabase/migrations/202607010007_add_avatar_fields.sql",
];

const fileChecks = requiredFiles.map((file) => ({
  file,
  exists: existsSync(path.resolve(process.cwd(), file)),
}));

const envChecks = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", requiredInStrict: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", requiredInStrict: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", requiredInStrict: false },
  { key: "AUTH_REQUIRED", requiredInStrict: true },
  { key: "NETLIFY_AUTH_TOKEN", requiredInStrict: true },
  { key: "NETLIFY_SITE_ID", requiredInStrict: true },
];

const missingFiles = fileChecks.filter((item) => !item.exists);
const missingStrictEnv = envChecks.filter(
  (item) =>
    item.requiredInStrict &&
    (!process.env[item.key] || (item.key === "AUTH_REQUIRED" && process.env.AUTH_REQUIRED !== "true")),
);

console.log("Phase 5 Deploy Readiness");
console.log("========================");
console.log(`Mode: ${strict ? "strict" : "informational"}`);
console.log("");

console.log("Files");
for (const check of fileChecks) {
  console.log(`- ${check.exists ? "OK" : "MISSING"} ${check.file}`);
}

console.log("");
console.log("Environment");
for (const item of envChecks) {
  const value = process.env[item.key];
  if (item.key === "AUTH_REQUIRED") {
    console.log(`- ${value === "true" ? "OK" : "WARN"} ${item.key}=${value ?? "<unset>"}`);
  } else {
    const level = value ? "OK" : item.requiredInStrict ? "WARN" : "INFO";
    console.log(`- ${level} ${item.key}`);
  }
}

console.log("");
if (!missingFiles.length && !missingStrictEnv.length) {
  console.log("Result: ready");
  process.exit(0);
}

if (strict) {
  console.log("Result: blocked");
  if (missingFiles.length) {
    console.log(`- Missing files: ${missingFiles.map((item) => item.file).join(", ")}`);
  }
  if (missingStrictEnv.length) {
    console.log(`- Missing strict env: ${missingStrictEnv.map((item) => item.key).join(", ")}`);
  }
  process.exit(1);
}

console.log("Result: partially ready");
if (missingFiles.length) {
  console.log(`- Missing files: ${missingFiles.map((item) => item.file).join(", ")}`);
}
if (missingStrictEnv.length) {
  console.log(`- Missing production env or auth toggle: ${missingStrictEnv.map((item) => item.key).join(", ")}`);
}
