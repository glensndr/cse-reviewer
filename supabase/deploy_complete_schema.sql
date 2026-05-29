-- Civil Service Exam Mastery - complete Supabase schema deployment
-- Safe for a fresh Supabase project and safe to rerun.
-- Run this entire file in Supabase SQL Editor.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'user_status') then
    create type public.user_status as enum ('Trial Pending', 'Trial Active', 'Approved', 'Suspended', 'Expired');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('Admin', 'Student');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  gmail_address text unique not null,
  registration_date timestamptz not null default now(),
  last_login timestamptz,
  status public.user_status not null default 'Trial Active',
  role public.app_role not null default 'Student',
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '30 minutes'),
  updated_at timestamptz not null default now(),
  constraint user_profiles_gmail_is_email check (position('@' in gmail_address) > 1),
  constraint user_profiles_trial_order check (trial_expires_at >= trial_started_at)
);

create table if not exists public.user_progress (
  user_id uuid primary key references public.users(id) on delete cascade,
  app_state jsonb not null default '{}'::jsonb,
  completed_lessons jsonb not null default '[]'::jsonb,
  quiz_results jsonb not null default '[]'::jsonb,
  mastery_scores jsonb not null default '[]'::jsonb,
  mock_exam_results jsonb not null default '[]'::jsonb,
  readiness_scores jsonb not null default '[]'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id text primary key,
  category text not null,
  sub_category text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  question text not null,
  choices jsonb not null,
  answer text not null,
  explanation text not null,
  hint text,
  learning_tip text,
  source text not null default 'built-in',
  created_at timestamptz not null default now(),
  constraint question_bank_four_choices check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) >= 4)
);

create table if not exists public.lessons (
  id text primary key,
  category text not null,
  topic text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  accuracy integer not null check (accuracy between 0 and 100),
  category_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id text not null,
  label text not null default 'Review Later',
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.analytics (
  user_id uuid primary key references public.users(id) on delete cascade,
  questions_answered integer not null default 0 check (questions_answered >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  incorrect_answers integer not null default 0 check (incorrect_answers >= 0),
  accuracy_rate numeric not null default 0 check (accuracy_rate >= 0 and accuracy_rate <= 100),
  average_response_time numeric not null default 0 check (average_response_time >= 0),
  mock_exams_completed integer not null default 0 check (mock_exams_completed >= 0),
  mastery_tests_passed integer not null default 0 check (mastery_tests_passed >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id text,
  device_info text,
  ip_address inet,
  action text not null default 'LOGIN',
  created_at timestamptz not null default now()
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_id text not null,
  device_info text,
  last_login timestamptz not null default now(),
  active boolean not null default true,
  unique (user_id, device_id)
);

create index if not exists users_email_idx on public.users (lower(email));
create index if not exists user_profiles_gmail_idx on public.user_profiles (lower(gmail_address));
create index if not exists user_profiles_status_idx on public.user_profiles (status);
create index if not exists user_profiles_role_idx on public.user_profiles (role);
create index if not exists user_profiles_last_login_idx on public.user_profiles (last_login desc);
create index if not exists user_progress_updated_at_idx on public.user_progress (updated_at desc);
create index if not exists question_bank_category_topic_idx on public.question_bank (category, sub_category);
create index if not exists question_bank_difficulty_idx on public.question_bank (difficulty);
create index if not exists question_bank_source_idx on public.question_bank (source);
create index if not exists lessons_category_topic_idx on public.lessons (category, topic);
create index if not exists mock_exams_user_created_idx on public.mock_exams (user_id, created_at desc);
create index if not exists bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);
create index if not exists login_history_user_created_idx on public.login_history (user_id, created_at desc);
create index if not exists device_sessions_user_active_idx on public.device_sessions (user_id, active, last_login desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_profiles_updated_at on public.user_profiles;
create trigger touch_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_user_progress_updated_at on public.user_progress;
create trigger touch_user_progress_updated_at
before update on public.user_progress
for each row execute function public.touch_updated_at();

drop trigger if exists touch_analytics_updated_at on public.analytics;
create trigger touch_analytics_updated_at
before update on public.analytics
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where user_id = auth.uid()
      and role = 'Admin'
      and status in ('Approved', 'Trial Active')
  );
$$;

create or replace function public.current_profile_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.user_profiles where user_id = auth.uid();
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where user_id = auth.uid();
$$;

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.question_bank enable row level security;
alter table public.lessons enable row level security;
alter table public.mock_exams enable row level security;
alter table public.bookmarks enable row level security;
alter table public.analytics enable row level security;
alter table public.login_history enable row level security;
alter table public.device_sessions enable row level security;

drop policy if exists "users read own or admin" on public.users;
drop policy if exists "users insert own" on public.users;
drop policy if exists "profiles read own or admin" on public.user_profiles;
drop policy if exists "profiles insert own" on public.user_profiles;
drop policy if exists "profiles update own safe fields" on public.user_profiles;
drop policy if exists "profiles admin update" on public.user_profiles;
drop policy if exists "progress own" on public.user_progress;
drop policy if exists "question bank readable" on public.question_bank;
drop policy if exists "lessons readable" on public.lessons;
drop policy if exists "mock exams own or admin" on public.mock_exams;
drop policy if exists "bookmarks own" on public.bookmarks;
drop policy if exists "analytics own or admin" on public.analytics;
drop policy if exists "login history own or admin" on public.login_history;
drop policy if exists "device sessions own or admin" on public.device_sessions;

create policy "users read own or admin" on public.users
for select using (id = auth.uid() or public.is_admin());

create policy "users insert own" on public.users
for insert with check (id = auth.uid());

create policy "profiles read own or admin" on public.user_profiles
for select using (user_id = auth.uid() or public.is_admin());

create policy "profiles insert own" on public.user_profiles
for insert with check (user_id = auth.uid());

create policy "profiles update own safe fields" on public.user_profiles
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status = public.current_profile_status()
  and role = public.current_profile_role()
);

create policy "profiles admin update" on public.user_profiles
for update
using (public.is_admin())
with check (public.is_admin());

create policy "progress own" on public.user_progress
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "question bank readable" on public.question_bank
for select using (true);

create policy "lessons readable" on public.lessons
for select using (true);

create policy "mock exams own or admin" on public.mock_exams
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "bookmarks own" on public.bookmarks
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "analytics own or admin" on public.analytics
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "login history own or admin" on public.login_history
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "device sessions own or admin" on public.device_sessions
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.question_bank, public.lessons to anon, authenticated;
grant select, insert, update, delete on
  public.users,
  public.user_profiles,
  public.user_progress,
  public.mock_exams,
  public.bookmarks,
  public.analytics,
  public.login_history,
  public.device_sessions
to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  insert into public.user_profiles (user_id, full_name, gmail_address, status, role, trial_started_at, trial_expires_at, last_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Trial Active',
    'Student',
    now(),
    now() + interval '30 minutes',
    now()
  )
  on conflict (user_id) do update
  set full_name = excluded.full_name,
      gmail_address = excluded.gmail_address,
      last_login = excluded.last_login;

  insert into public.user_progress (user_id, app_state)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  insert into public.analytics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill app rows for Google/Auth users that existed before this schema was deployed.
insert into public.users (id, email, full_name, created_at)
select id,
       email,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
       coalesce(created_at, now())
from auth.users
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name;

insert into public.user_profiles (user_id, full_name, gmail_address, status, role, trial_started_at, trial_expires_at, last_login)
select id,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
       email,
       'Trial Active',
       'Student',
       now(),
       now() + interval '30 minutes',
       now()
from auth.users
on conflict (user_id) do nothing;

insert into public.user_progress (user_id, app_state)
select id, '{}'::jsonb
from auth.users
on conflict (user_id) do nothing;

insert into public.analytics (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

-- Optional: after deployment, approve an account manually from SQL Editor:
-- update public.user_profiles set status = 'Approved' where lower(gmail_address) = lower('glensndr@gmail.com');
-- Optional: make an account admin:
-- update public.user_profiles set role = 'Admin', status = 'Approved' where lower(gmail_address) = lower('glensndr@gmail.com');
