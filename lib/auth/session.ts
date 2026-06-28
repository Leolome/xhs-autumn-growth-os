import { redirect } from "next/navigation";

import type { UserContext, UserRole } from "@/lib/auth/types";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { Campus } from "@/lib/types";

type UserProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  campus: Campus | null;
  owner_account_ids: string[] | null;
  is_active: boolean;
};

const defaultRole = (process.env.AUTH_MOCK_ROLE as UserRole | undefined) ?? "admin";
const defaultCampus = (process.env.AUTH_MOCK_CAMPUS as Campus | undefined) ?? null;

export function isAuthRequired() {
  return process.env.AUTH_REQUIRED === "true";
}

export function getMockUserContext(): UserContext {
  return {
    id: "internal-mvp-admin",
    email: "internal@xhs-growth.local",
    displayName: process.env.AUTH_MOCK_NAME ?? "内部运营管理员",
    role: defaultRole,
    campus: defaultCampus,
    ownerAccountIds: [],
    isMock: true,
  };
}

export async function getCurrentUserContext(): Promise<UserContext> {
  if (!hasSupabaseConfig() || !isAuthRequired()) {
    return getMockUserContext();
  }

  const supabase = await createServerSupabaseAuthClient();
  if (!supabase) return getMockUserContext();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id,email,display_name,role,campus,owner_account_ids,is_active")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  if (!profile?.is_active) {
    return {
      id: user.id,
      email: user.email ?? "",
      displayName: user.email ?? "未配置用户",
      role: "viewer",
      campus: null,
      ownerAccountIds: [],
      isMock: false,
    };
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    displayName: profile.display_name ?? user.email ?? "运营用户",
    role: profile.role,
    campus: profile.campus,
    ownerAccountIds: profile.owner_account_ids ?? [],
    isMock: false,
  };
}
