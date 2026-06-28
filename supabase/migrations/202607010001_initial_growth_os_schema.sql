create type account_type as enum ('teacher', 'koc');
create type campus as enum ('礼嘉', '北岸', '人和', '九龙坡', '凯德', '其他');
create type content_type as enum (
  '提问笔记',
  '资料分析',
  '课堂互动视频',
  '板书分享',
  '学员展示',
  '开学倒计时',
  '体检转化',
  '家长共情',
  '生活化定位内容',
  '真实问题收集',
  '资料分享',
  '校区周边内容',
  '其他'
);
create type task_status as enum ('todo', 'drafting', 'published', 'data_filled', 'reviewed');
create type lead_stage as enum (
  'new',
  'dm_opened',
  'resource_sent',
  'assessed',
  'group_joined',
  'to_invite',
  'booked',
  'arrived',
  'strong_intent',
  'converted',
  'nurturing',
  'lost'
);
create type intent_level as enum ('A', 'B', 'C', 'D', 'F');
create type booking_status as enum (
  'to_invite',
  'pending_reply',
  'booked',
  'rescheduled',
  'no_show',
  'arrived',
  'feedback_done',
  'strong_intent',
  'registered',
  'not_now'
);
create type data_source as enum ('crawler', 'manual', 'csv');
create type crawl_error_type as enum ('timeout', 'blocked', 'parse_error', 'not_found', 'network_error', 'unknown');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table accounts (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  name text not null,
  type account_type not null,
  campus campus not null,
  owner text not null,
  role text,
  profile_url text not null,
  positioning text not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'paused', 'risk')),
  followers integer not null default 0,
  total_engagement integer not null default 0,
  posts integer not null default 0,
  last_snapshot_at timestamptz,
  week_expected integer not null default 0,
  week_published integer not null default 0,
  data_pending integer not null default 0,
  lead_dm integer not null default 0,
  lead_assessments integer not null default 0,
  lead_groups integer not null default 0,
  lead_bookings integer not null default 0,
  lead_a_level integer not null default 0
);

create table tasks (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  assigned_date date not null,
  account_id text not null references accounts(id) on delete restrict,
  campus campus not null,
  content_type content_type not null,
  suggested_title text not null,
  hook text not null,
  required_assets text[] not null default '{}',
  cta text not null,
  compliance_note text not null,
  status task_status not null default 'todo',
  note_url text,
  source_lead_ids text[] not null default '{}',
  metric_likes integer not null default 0,
  metric_saves integer not null default 0,
  metric_comments integer not null default 0,
  metric_dm integer not null default 0,
  metric_assessments integer not null default 0,
  metric_bookings integer not null default 0
);

create table xhs_notes (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  task_id text references tasks(id) on delete set null,
  account_id text not null references accounts(id) on delete restrict,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  content_type content_type not null,
  source data_source not null default 'manual',
  source_lead_ids text[] not null default '{}'
);

create table leads (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  parent_nickname text not null,
  student_grade text not null,
  region text not null,
  campus campus not null,
  source_account_id text references accounts(id) on delete set null,
  source_note_id text references xhs_notes(id) on delete set null,
  pain_points text[] not null default '{}',
  intent_score integer not null default 0 check (intent_score >= 0 and intent_score <= 100),
  intent_level intent_level not null default 'D',
  stage lead_stage not null default 'new',
  owner text not null,
  next_action text not null,
  next_follow_up_at timestamptz,
  notes text,
  latest_activity text,
  latest_activity_at timestamptz
);

create table lead_activities (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  lead_id text not null references leads(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  note text not null
);

create table bookings (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  lead_id text not null references leads(id) on delete cascade,
  campus campus not null,
  event_type text not null check (event_type in ('定位课', '开放日', '体验课', '家长沟通')),
  title text not null,
  scheduled_at timestamptz not null,
  reception_teacher text,
  capacity integer not null default 0,
  booked_count integer not null default 0,
  status booking_status not null default 'to_invite',
  script text not null,
  arrival_feedback text,
  no_show_reason text,
  recommended_class text,
  next_action text not null
);

create table crawl_runs (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('success', 'partial', 'partial_failed', 'failed')),
  target_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  source data_source not null default 'crawler'
);

create table crawl_targets (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  target_type text not null check (target_type in ('account', 'profile', 'note', 'benchmark')),
  account_id text references accounts(id) on delete set null,
  note_id text references xhs_notes(id) on delete cascade,
  url text not null,
  cadence text not null default '3d',
  crawl_frequency text not null default '3d',
  is_active boolean not null default true,
  status text not null default 'active' check (status in ('active', 'paused', 'manual')),
  last_crawled_at timestamptz,
  next_crawled_at timestamptz
);

create table crawl_errors (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  crawl_run_id text not null references crawl_runs(id) on delete cascade,
  target_id text references crawl_targets(id) on delete set null,
  url text,
  error_type crawl_error_type not null,
  message text not null,
  resolved boolean not null default false
);

create table account_snapshots (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  account_id text not null references accounts(id) on delete cascade,
  captured_at timestamptz not null,
  followers integer not null default 0,
  total_engagement integer not null default 0,
  posts integer not null default 0,
  source data_source not null default 'crawler',
  note text,
  raw_data jsonb not null default '{}'::jsonb
);

create table note_snapshots (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  note_id text not null references xhs_notes(id) on delete cascade,
  captured_at timestamptz not null,
  likes integer not null default 0,
  saves integer not null default 0,
  comments integer not null default 0,
  source data_source not null default 'crawler',
  note text,
  raw_data jsonb not null default '{}'::jsonb
);

create table benchmarks (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  name text not null,
  category text not null,
  positioning text not null,
  url text not null,
  learnings text[] not null default '{}'
);

create table benchmark_notes (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  account_name text not null,
  title text not null,
  hook text not null,
  cover_formula text not null,
  comment_insight text not null,
  reusable_direction text not null
);

create table review_weekly_summaries (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  week_start date not null,
  week_end date not null,
  summary jsonb not null default '{}'::jsonb,
  next_actions jsonb not null default '[]'::jsonb
);

create index idx_tasks_account_id on tasks(account_id);
create index idx_tasks_assigned_date on tasks(assigned_date);
create index idx_tasks_status on tasks(status);
create index idx_tasks_campus on tasks(campus);
create index idx_xhs_notes_account_id on xhs_notes(account_id);
create index idx_xhs_notes_task_id on xhs_notes(task_id);
create index idx_leads_source_account_id on leads(source_account_id);
create index idx_leads_source_note_id on leads(source_note_id);
create index idx_leads_stage on leads(stage);
create index idx_leads_campus on leads(campus);
create index idx_leads_intent_level on leads(intent_level);
create index idx_leads_owner on leads(owner);
create index idx_lead_activities_lead_id_at on lead_activities(lead_id, at desc);
create index idx_bookings_lead_id on bookings(lead_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_scheduled_at on bookings(scheduled_at);
create index idx_crawl_targets_account_id on crawl_targets(account_id);
create index idx_crawl_targets_note_id on crawl_targets(note_id);
create index idx_crawl_targets_due on crawl_targets(is_active, next_crawled_at);
create index idx_crawl_errors_run_id on crawl_errors(crawl_run_id);
create index idx_account_snapshots_account_captured on account_snapshots(account_id, captured_at desc);
create index idx_note_snapshots_note_captured on note_snapshots(note_id, captured_at desc);
create index idx_review_weekly_summaries_period on review_weekly_summaries(week_start, week_end);

create trigger set_accounts_updated_at before update on accounts for each row execute function set_updated_at();
create trigger set_tasks_updated_at before update on tasks for each row execute function set_updated_at();
create trigger set_xhs_notes_updated_at before update on xhs_notes for each row execute function set_updated_at();
create trigger set_leads_updated_at before update on leads for each row execute function set_updated_at();
create trigger set_lead_activities_updated_at before update on lead_activities for each row execute function set_updated_at();
create trigger set_bookings_updated_at before update on bookings for each row execute function set_updated_at();
create trigger set_crawl_runs_updated_at before update on crawl_runs for each row execute function set_updated_at();
create trigger set_crawl_targets_updated_at before update on crawl_targets for each row execute function set_updated_at();
create trigger set_crawl_errors_updated_at before update on crawl_errors for each row execute function set_updated_at();
create trigger set_account_snapshots_updated_at before update on account_snapshots for each row execute function set_updated_at();
create trigger set_note_snapshots_updated_at before update on note_snapshots for each row execute function set_updated_at();
create trigger set_benchmarks_updated_at before update on benchmarks for each row execute function set_updated_at();
create trigger set_benchmark_notes_updated_at before update on benchmark_notes for each row execute function set_updated_at();
create trigger set_review_weekly_summaries_updated_at before update on review_weekly_summaries for each row execute function set_updated_at();

alter table accounts enable row level security;
alter table tasks enable row level security;
alter table xhs_notes enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table bookings enable row level security;
alter table crawl_runs enable row level security;
alter table crawl_targets enable row level security;
alter table crawl_errors enable row level security;
alter table account_snapshots enable row level security;
alter table note_snapshots enable row level security;
alter table benchmarks enable row level security;
alter table benchmark_notes enable row level security;
alter table review_weekly_summaries enable row level security;

create policy "mvp internal read accounts" on accounts for select using (true);
create policy "mvp internal write accounts" on accounts for all using (true) with check (true);
create policy "mvp internal read tasks" on tasks for select using (true);
create policy "mvp internal write tasks" on tasks for all using (true) with check (true);
create policy "mvp internal read xhs_notes" on xhs_notes for select using (true);
create policy "mvp internal write xhs_notes" on xhs_notes for all using (true) with check (true);
create policy "mvp internal read leads" on leads for select using (true);
create policy "mvp internal write leads" on leads for all using (true) with check (true);
create policy "mvp internal read lead_activities" on lead_activities for select using (true);
create policy "mvp internal write lead_activities" on lead_activities for all using (true) with check (true);
create policy "mvp internal read bookings" on bookings for select using (true);
create policy "mvp internal write bookings" on bookings for all using (true) with check (true);
create policy "mvp internal read crawl_runs" on crawl_runs for select using (true);
create policy "mvp internal write crawl_runs" on crawl_runs for all using (true) with check (true);
create policy "mvp internal read crawl_targets" on crawl_targets for select using (true);
create policy "mvp internal write crawl_targets" on crawl_targets for all using (true) with check (true);
create policy "mvp internal read crawl_errors" on crawl_errors for select using (true);
create policy "mvp internal write crawl_errors" on crawl_errors for all using (true) with check (true);
create policy "mvp internal read account_snapshots" on account_snapshots for select using (true);
create policy "mvp internal write account_snapshots" on account_snapshots for all using (true) with check (true);
create policy "mvp internal read note_snapshots" on note_snapshots for select using (true);
create policy "mvp internal write note_snapshots" on note_snapshots for all using (true) with check (true);
create policy "mvp internal read benchmarks" on benchmarks for select using (true);
create policy "mvp internal write benchmarks" on benchmarks for all using (true) with check (true);
create policy "mvp internal read benchmark_notes" on benchmark_notes for select using (true);
create policy "mvp internal write benchmark_notes" on benchmark_notes for all using (true) with check (true);
create policy "mvp internal read review_weekly_summaries" on review_weekly_summaries for select using (true);
create policy "mvp internal write review_weekly_summaries" on review_weekly_summaries for all using (true) with check (true);
