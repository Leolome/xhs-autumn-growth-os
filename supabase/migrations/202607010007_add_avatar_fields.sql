alter table accounts
  add column if not exists avatar_url text;

alter table benchmarks
  add column if not exists avatar_url text;
