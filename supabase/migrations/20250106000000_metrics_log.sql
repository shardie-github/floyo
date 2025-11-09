-- Performance Intelligence Layer: metrics_log table
-- Centralized telemetry storage for all performance metrics

create table if not exists public.metrics_log (
  id bigint generated always as identity primary key,
  ts timestamptz default now(),
  source text not null,  -- 'vercel', 'supabase', 'expo', 'ci', 'client', 'telemetry'
  metric jsonb not null,  -- Flexible JSON structure for any metric type
  created_at timestamptz default now()
);

-- Indexes for efficient querying
create index if not exists idx_metrics_log_ts on public.metrics_log(ts desc);
create index if not exists idx_metrics_log_source on public.metrics_log(source);
create index if not exists idx_metrics_log_metric_gin on public.metrics_log using gin(metric);

-- RLS policies
alter table public.metrics_log enable row level security;

-- Service role can insert (for automated collection)
create policy "metrics_log_service_insert" 
  on public.metrics_log 
  for insert 
  with check (true);

-- Authenticated users can read their own metrics (if user_id in metric JSON)
create policy "metrics_log_read_own" 
  on public.metrics_log 
  for select 
  using (
    auth.role() = 'service_role' OR
    (metric->>'user_id')::uuid = auth.uid() OR
    metric->>'user_id' IS NULL  -- Allow reading anonymous metrics
  );

-- Admin users can read all metrics
create policy "metrics_log_admin_read" 
  on public.metrics_log 
  for select 
  using (
    auth.role() = 'service_role' OR
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Comments for documentation
comment on table public.metrics_log is 'Centralized performance metrics storage for Performance Intelligence Layer';
comment on column public.metrics_log.source is 'Source of the metric: vercel, supabase, expo, ci, client, telemetry';
comment on column public.metrics_log.metric is 'JSONB metric data with flexible schema';
