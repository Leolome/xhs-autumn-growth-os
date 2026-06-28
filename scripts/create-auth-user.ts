import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { UserRole } from "../lib/auth/types";

type Args = {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  campus?: string;
  accounts?: string;
};

const validRoles: UserRole[] = ["admin", "operator", "campus_manager", "teacher", "viewer"];

function parseArgs(argv: string[]): Args {
  return argv.reduce<Args>((acc, item) => {
    const [key, ...valueParts] = item.replace(/^--/, "").split("=");
    const value = valueParts.join("=");
    if (!key || !value) return acc;
    return { ...acc, [key]: value };
  }, {});
}

function usage() {
  return [
    "Usage:",
    "pnpm auth:create-user --email=name@example.com --password=ChangeMe123! --name=姓名 --role=campus_manager --campus=礼嘉",
    "",
    "Roles: admin, operator, campus_manager, teacher, viewer",
    "Optional: --accounts=account-1,account-2",
  ].join("\n");
}

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before creating auth users.");
  }

  if (!args.email || !args.password) {
    console.log(usage());
    throw new Error("Missing --email or --password.");
  }

  const role = args.role ?? "viewer";
  if (!validRoles.includes(role)) {
    console.log(usage());
    throw new Error(`Invalid role: ${role}`);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let user = await findUserByEmail(supabase, args.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: {
        display_name: args.name ?? args.email,
      },
    });
    if (error) throw error;
    user = data.user;
  }

  if (!user) throw new Error("Auth user was not created or found.");

  const ownerAccountIds = args.accounts
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    [
      {
        id: user.id,
        email: args.email,
        display_name: args.name ?? args.email,
        role,
        campus: args.campus || null,
        owner_account_ids: ownerAccountIds,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" },
  );

  if (profileError) throw profileError;

  console.log(`auth user ready: ${args.email}`);
  console.log(`profile: role=${role}, campus=${args.campus || "全部校区"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
