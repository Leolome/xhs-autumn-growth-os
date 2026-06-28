create table if not exists audit_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  actor_id text not null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  campus campus,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity_type on audit_logs(entity_type);
create index if not exists idx_audit_logs_entity_id on audit_logs(entity_id);
create index if not exists idx_audit_logs_campus on audit_logs(campus);

drop trigger if exists set_audit_logs_updated_at on audit_logs;
create trigger set_audit_logs_updated_at
before update on audit_logs
for each row execute function set_updated_at();

alter table audit_logs enable row level security;

drop policy if exists "mvp internal read audit_logs" on audit_logs;
create policy "mvp internal read audit_logs" on audit_logs for select using (true);

drop policy if exists "mvp internal write audit_logs" on audit_logs;
create policy "mvp internal write audit_logs" on audit_logs for all using (true) with check (true);
