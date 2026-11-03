create table if not exists public.project_match_state (
  collection text not null check (
    collection in (
      'users',
      'skills',
      'projects',
      'teams',
      'tasks',
      'conversations',
      'messages',
      'requests',
      'notifications',
      'ratings',
      'feedback',
      'auditLogs',
      'reports'
    )
  ),
  record_id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (collection, record_id),
  check (data ->> 'id' = record_id)
);

alter table public.project_match_state enable row level security;

revoke all on public.project_match_state from anon, authenticated;
grant all on public.project_match_state to service_role;
