create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text null,
  analysis_id uuid null references analysis_history(id) on delete set null,
  order_id text null,
  order_type text null,
  amount integer null,
  path text null,
  referrer text null,
  user_agent text null,
  ip_address text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx
  on analytics_events(created_at desc);

create index if not exists analytics_events_event_name_idx
  on analytics_events(event_name, created_at desc);

create index if not exists analytics_events_session_idx
  on analytics_events(session_id, created_at desc);

create index if not exists analytics_events_analysis_idx
  on analytics_events(analysis_id, created_at desc);

alter table analytics_events enable row level security;

-- Events are inserted and read through Vercel serverless functions with the
-- Supabase service-role key. No direct browser access is needed.
