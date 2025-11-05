-- [STAKE+TRUST:BEGIN:audit_migration]
-- Create audit_log table for user action tracking
-- Online-safe migration (no CONCURRENTLY in transaction)

-- Create table if it doesn't exist
create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  meta jsonb,
  ts timestamptz default now()
);

-- Create index on user_id for faster queries
create index if not exists idx_audit_log_user_id on public.audit_log(user_id);

-- Create index on timestamp for sorting
create index if not exists idx_audit_log_ts on public.audit_log(ts desc);

-- Enable Row Level Security
alter table public.audit_log enable row level security;

-- Drop existing policy if it exists (idempotent)
drop policy if exists "audit_owner" on public.audit_log;

-- Create policy: users can only access their own audit logs
create policy "audit_owner" on public.audit_log
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add comment for documentation
comment on table public.audit_log is 'User action audit log for transparency and compliance';
comment on column public.audit_log.user_id is 'Reference to auth.users';
comment on column public.audit_log.action is 'Action performed (e.g., login, data_export, settings_change)';
comment on column public.audit_log.meta is 'Additional metadata in JSON format';
comment on column public.audit_log.ts is 'Timestamp when action occurred';
-- [STAKE+TRUST:END:audit_migration]
