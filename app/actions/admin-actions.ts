"use server";

import { revalidatePath } from "next/cache";

import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { appendAuditLog } from "@/lib/services/audit";
import { createManagedUser, upsertUserProfile } from "@/lib/services/user-profiles";
import type { ManagedUserInput, UserProfile } from "@/lib/auth/types";

function denied() {
  return { ok: false, fallback: false, error: "当前账号没有权限管理用户和校区。", profile: undefined };
}

async function recordAdminAudit(
  user: Awaited<ReturnType<typeof getCurrentUserContext>>,
  action: string,
  entityId: string,
  detail: Record<string, unknown>,
) {
  await appendAuditLog({
    id: `audit-user-${entityId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action,
    entityType: "user_profile",
    entityId,
    detail,
  });
}

export async function saveManagedUser(input: ManagedUserInput) {
  const user = await getCurrentUserContext();
  if (!canManageUsers(user)) return denied();

  const result = await createManagedUser(input);
  if (result.ok) {
    await recordAdminAudit(user, "创建或更新用户权限", input.email, {
      email: input.email,
      role: input.role,
      campus: input.campus,
      isActive: input.isActive,
    });
  }

  revalidatePath("/dashboard");
  return result;
}

export async function saveUserProfileAction(profile: UserProfile) {
  const user = await getCurrentUserContext();
  if (!canManageUsers(user)) return denied();

  const result = await upsertUserProfile(profile);
  if (result.ok) {
    await recordAdminAudit(user, "更新用户权限", profile.id, {
      email: profile.email,
      role: profile.role,
      campus: profile.campus,
      isActive: profile.isActive,
    });
  }

  revalidatePath("/dashboard");
  return result;
}
