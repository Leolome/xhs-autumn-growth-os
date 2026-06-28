alter type content_type add value if not exists '其他';
alter type crawl_error_type add value if not exists 'network_error';

alter table xhs_notes add column if not exists source data_source not null default 'manual';

alter table crawl_runs drop constraint if exists crawl_runs_status_check;
alter table crawl_runs add constraint crawl_runs_status_check check (status in ('success', 'partial', 'partial_failed', 'failed'));

alter table crawl_targets add column if not exists crawl_frequency text not null default '3d';
alter table crawl_targets add column if not exists is_active boolean not null default true;
alter table crawl_targets add column if not exists next_crawled_at timestamptz;
alter table crawl_targets drop constraint if exists crawl_targets_target_type_check;
alter table crawl_targets add constraint crawl_targets_target_type_check check (target_type in ('account', 'profile', 'note', 'benchmark'));
create index if not exists idx_crawl_targets_due on crawl_targets(is_active, next_crawled_at);

alter table crawl_errors add column if not exists url text;

alter table account_snapshots add column if not exists raw_data jsonb not null default '{}'::jsonb;
alter table note_snapshots add column if not exists raw_data jsonb not null default '{}'::jsonb;
