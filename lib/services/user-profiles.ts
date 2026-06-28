import { createServerSupabaseDataClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { mapUserProfileRow, userProfileToRow } from "@/lib/services/mappers";
import type { ManagedUserInput, UserProfile } from "@/lib/auth/types";

async function findUserIdByEmail(email: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
    if (error) return null;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 500) return null;
  }

  return null;
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("user_profiles").select("*").order("created_at");
  if (error || !data?.length) return [];

  return data.map(mapUserProfileRow);
}

export async function upsertUserProfile(profile: UserProfile) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true, profile };

  const { error } = await supabase.from("user_profiles").upsert([userProfileToRow(profile)], { onConflict: "id" });
  return { ok: !error, fallback: false, error: error?.message, profile };
}

export async function createManagedUser(input: ManagedUserInput) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { ok: true, fallback: true, profile: undefined };

  let userId = input.id || (await findUserIdByEmail(input.email));

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password || `Temp#${Date.now()}`,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
      },
    });
    if (error || !data.user) {
      return { ok: false, fallback: false, error: error?.message || "无法创建登录用户。", profile: undefined };
    }
    userId = data.user.id;
  } else {
    await supabase.auth.admin.updateUserById(userId, {
      email: input.email,
      password: input.password || undefined,
      user_metadata: {
        display_name: input.displayName,
      },
    });
  }

  const profile: UserProfile = {
    id: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    campus: input.campus,
    ownerAccountIds: input.ownerAccountIds,
    isActive: input.isActive,
  };

  return upsertUserProfile(profile);
}
