create type user_role as enum ('admin', 'operator', 'campus_manager', 'teacher', 'viewer');

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  display_name text not null,
  role user_role not null default 'viewer',
  campus campus,
  owner_account_ids text[] not null default '{}',
  is_active boolean not null default true,
  created_by text,
  updated_by text
);

create index if not exists idx_user_profiles_role on user_profiles(role);
create index if not exists idx_user_profiles_campus on user_profiles(campus);
create index if not exists idx_user_profiles_is_active on user_profiles(is_active);

drop trigger if exists set_user_profiles_updated_at on user_profiles;
create trigger set_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();

alter table user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on user_profiles;
create policy "user_profiles_select_own"
on user_profiles for select
using (auth.uid() = id);

drop policy if exists "user_profiles_service_role_all" on user_profiles;
create policy "user_profiles_service_role_all"
on user_profiles for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

comment on table user_profiles is 'Phase 4 user profile table for role and campus scoping. Keep service role server-side only.';
