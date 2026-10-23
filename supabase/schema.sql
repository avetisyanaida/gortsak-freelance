-- Gortsak freelance marketplace schema for Supabase Postgres.
-- Run this once in Supabase Dashboard → SQL Editor before seed.sql.

create table if not exists public.profiles (
  user_id text primary key,
  display_name text not null,
  email text not null,
  role text not null check (role in ('employer', 'freelancer')),
  bio text not null default '',
  resume_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key,
  employer_id text not null references public.profiles(user_id),
  title text not null,
  description text not null,
  category text not null,
  budget integer not null check (budget >= 1000),
  duration_days integer not null check (duration_days > 0),
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  freelancer_id text not null references public.profiles(user_id),
  proposal text not null,
  bid integer not null check (bid > 0),
  status text not null default 'pending' check (status in ('pending', 'selected', 'declined')),
  created_at timestamptz not null default now(),
  unique (job_id, freelancer_id)
);

create table if not exists public.conversations (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  employer_id text not null references public.profiles(user_id),
  freelancer_id text not null references public.profiles(user_id),
  application_id text not null unique references public.applications(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null references public.profiles(user_id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists jobs_status_created_idx on public.jobs(status, created_at desc);
create index if not exists applications_job_created_idx on public.applications(job_id, created_at desc);
create index if not exists conversations_employer_idx on public.conversations(employer_id, created_at desc);
create index if not exists conversations_freelancer_idx on public.conversations(freelancer_id, created_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- The app's server routes authenticate visitors and verify each participant before using the server key.
-- No direct browser grants or RLS policies are added for anon/authenticated roles.
revoke all on public.profiles, public.jobs, public.applications, public.conversations, public.messages from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.jobs, public.applications, public.conversations, public.messages to service_role;
