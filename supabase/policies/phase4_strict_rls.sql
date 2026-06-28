-- Phase 4 strict RLS hardening.
-- Apply this after Supabase Auth users and user_profiles are ready, and after AUTH_REQUIRED=true is set.
-- Do not apply to an open internal demo environment that still depends on anonymous Supabase access.

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = (select auth.uid()) and is_active = true;
$$;

create or replace function public.current_user_campus()
returns campus
language sql
stable
security definer
set search_path = public
as $$
  select campus from public.user_profiles where id = (select auth.uid()) and is_active = true;
$$;

create or replace function public.can_access_campus(target_campus campus)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and is_active = true
      and (
        role in ('admin', 'operator')
        or campus = target_campus
      )
  );
$$;

create or replace function public.can_write_campus(target_campus campus)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and is_active = true
      and role <> 'viewer'
      and (
        role in ('admin', 'operator')
        or campus = target_campus
      )
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'accounts',
    'tasks',
    'leads',
    'bookings',
    'review_weekly_summaries'
  ]
  loop
    execute format('drop policy if exists "mvp internal read %s" on %I', table_name, table_name);
    execute format('drop policy if exists "mvp internal write %s" on %I', table_name, table_name);
  end loop;
end $$;

create policy "accounts campus read" on accounts
for select to authenticated
using ((select public.can_access_campus(campus)));

create policy "accounts campus write" on accounts
for all to authenticated
using ((select public.can_write_campus(campus)))
with check ((select public.can_write_campus(campus)));

create policy "tasks campus read" on tasks
for select to authenticated
using ((select public.can_access_campus(campus)));

create policy "tasks campus write" on tasks
for all to authenticated
using ((select public.can_write_campus(campus)))
with check ((select public.can_write_campus(campus)));

create policy "leads campus read" on leads
for select to authenticated
using ((select public.can_access_campus(campus)));

create policy "leads campus write" on leads
for all to authenticated
using ((select public.can_write_campus(campus)))
with check ((select public.can_write_campus(campus)));

create policy "bookings campus read" on bookings
for select to authenticated
using ((select public.can_access_campus(campus)));

create policy "bookings campus write" on bookings
for all to authenticated
using ((select public.can_write_campus(campus)))
with check ((select public.can_write_campus(campus)));

create policy "review summaries authenticated read" on review_weekly_summaries
for select to authenticated
using ((select public.current_user_role()) in ('admin', 'operator', 'campus_manager', 'teacher', 'viewer'));

create policy "review summaries operator write" on review_weekly_summaries
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

drop policy if exists "mvp internal read xhs_notes" on xhs_notes;
drop policy if exists "mvp internal write xhs_notes" on xhs_notes;
create policy "xhs_notes account campus read" on xhs_notes
for select to authenticated
using (
  exists (
    select 1 from accounts
    where accounts.id = xhs_notes.account_id
      and (select public.can_access_campus(accounts.campus))
  )
);
create policy "xhs_notes account campus write" on xhs_notes
for all to authenticated
using (
  exists (
    select 1 from accounts
    where accounts.id = xhs_notes.account_id
      and (select public.can_write_campus(accounts.campus))
  )
)
with check (
  exists (
    select 1 from accounts
    where accounts.id = xhs_notes.account_id
      and (select public.can_write_campus(accounts.campus))
  )
);

drop policy if exists "mvp internal read lead_activities" on lead_activities;
drop policy if exists "mvp internal write lead_activities" on lead_activities;
create policy "lead_activities lead campus read" on lead_activities
for select to authenticated
using (
  exists (
    select 1 from leads
    where leads.id = lead_activities.lead_id
      and (select public.can_access_campus(leads.campus))
  )
);
create policy "lead_activities lead campus write" on lead_activities
for all to authenticated
using (
  exists (
    select 1 from leads
    where leads.id = lead_activities.lead_id
      and (select public.can_write_campus(leads.campus))
  )
)
with check (
  exists (
    select 1 from leads
    where leads.id = lead_activities.lead_id
      and (select public.can_write_campus(leads.campus))
  )
);

drop policy if exists "mvp internal read account_snapshots" on account_snapshots;
drop policy if exists "mvp internal write account_snapshots" on account_snapshots;
create policy "account_snapshots account campus read" on account_snapshots
for select to authenticated
using (
  exists (
    select 1 from accounts
    where accounts.id = account_snapshots.account_id
      and (select public.can_access_campus(accounts.campus))
  )
);
create policy "account_snapshots account campus write" on account_snapshots
for all to authenticated
using (
  exists (
    select 1 from accounts
    where accounts.id = account_snapshots.account_id
      and (select public.can_write_campus(accounts.campus))
  )
)
with check (
  exists (
    select 1 from accounts
    where accounts.id = account_snapshots.account_id
      and (select public.can_write_campus(accounts.campus))
  )
);

drop policy if exists "mvp internal read note_snapshots" on note_snapshots;
drop policy if exists "mvp internal write note_snapshots" on note_snapshots;
create policy "note_snapshots note campus read" on note_snapshots
for select to authenticated
using (
  exists (
    select 1
    from xhs_notes
    join accounts on accounts.id = xhs_notes.account_id
    where xhs_notes.id = note_snapshots.note_id
      and (select public.can_access_campus(accounts.campus))
  )
);
create policy "note_snapshots note campus write" on note_snapshots
for all to authenticated
using (
  exists (
    select 1
    from xhs_notes
    join accounts on accounts.id = xhs_notes.account_id
    where xhs_notes.id = note_snapshots.note_id
      and (select public.can_write_campus(accounts.campus))
  )
)
with check (
  exists (
    select 1
    from xhs_notes
    join accounts on accounts.id = xhs_notes.account_id
    where xhs_notes.id = note_snapshots.note_id
      and (select public.can_write_campus(accounts.campus))
  )
);

-- Crawl runs and crawl errors are operational logs. Keep them admin/operator scoped in the strict mode.
drop policy if exists "mvp internal read crawl_runs" on crawl_runs;
drop policy if exists "mvp internal write crawl_runs" on crawl_runs;
drop policy if exists "mvp internal read crawl_errors" on crawl_errors;
drop policy if exists "mvp internal write crawl_errors" on crawl_errors;
drop policy if exists "mvp internal read crawl_targets" on crawl_targets;
drop policy if exists "mvp internal write crawl_targets" on crawl_targets;

create policy "crawl_runs operator read" on crawl_runs
for select to authenticated
using ((select public.current_user_role()) in ('admin', 'operator', 'campus_manager', 'teacher', 'viewer'));
create policy "crawl_runs operator write" on crawl_runs
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

create policy "crawl_errors operator read" on crawl_errors
for select to authenticated
using ((select public.current_user_role()) in ('admin', 'operator', 'campus_manager', 'teacher', 'viewer'));
create policy "crawl_errors operator write" on crawl_errors
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

create policy "crawl_targets authenticated read" on crawl_targets
for select to authenticated
using (true);
create policy "crawl_targets operator write" on crawl_targets
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

-- Benchmarks remain a shared research library: authenticated users can read, only admin/operator can write.
drop policy if exists "mvp internal read benchmarks" on benchmarks;
drop policy if exists "mvp internal write benchmarks" on benchmarks;
drop policy if exists "mvp internal read benchmark_notes" on benchmark_notes;
drop policy if exists "mvp internal write benchmark_notes" on benchmark_notes;

create policy "benchmarks authenticated read" on benchmarks
for select to authenticated
using (true);
create policy "benchmarks operator write" on benchmarks
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

create policy "benchmark_notes authenticated read" on benchmark_notes
for select to authenticated
using (true);
create policy "benchmark_notes operator write" on benchmark_notes
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));

drop policy if exists "mvp internal read audit_logs" on audit_logs;
drop policy if exists "mvp internal write audit_logs" on audit_logs;
create policy "audit_logs operator read" on audit_logs
for select to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'));
create policy "audit_logs authenticated write" on audit_logs
for insert to authenticated
with check ((select public.current_user_role()) in ('admin', 'operator', 'campus_manager', 'teacher'));

drop policy if exists "user_profiles_select_own" on user_profiles;
drop policy if exists "user_profiles_service_role_all" on user_profiles;
create policy "user_profiles own or admin read" on user_profiles
for select to authenticated
using (
  (select auth.uid()) = id
  or (select public.current_user_role()) in ('admin', 'operator')
);
create policy "user_profiles admin write" on user_profiles
for all to authenticated
using ((select public.current_user_role()) in ('admin', 'operator'))
with check ((select public.current_user_role()) in ('admin', 'operator'));
