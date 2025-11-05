create table if not exists public.telemetry_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app text default 'web',    -- app namespace (floyo, whatsfordinner, etc.)
  type text not null,        -- 'view','click','error','complete','like','save','custom:*'
  path text,
  meta jsonb,
  ts timestamptz default now()
);
alter table public.telemetry_events enable row level security;
create policy "telemetry_owner" on public.telemetry_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
