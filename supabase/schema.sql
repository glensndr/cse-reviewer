create extension if not exists "pgcrypto";

create type public.user_status as enum ('Trial Pending', 'Trial Active', 'Approved', 'Suspended', 'Expired');
create type public.app_role as enum ('Admin', 'Student');

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
  updated_at timestamptz not null default now()
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
  difficulty text not null,
  question text not null,
  choices jsonb not null,
  answer text not null,
  explanation text not null,
  hint text,
  learning_tip text,
  source text default 'built-in',
  status text not null default 'Approved',
  tags jsonb not null default '[]'::jsonb,
  date_generated timestamptz,
  approved_by text,
  approved_at timestamptz,
  times_answered integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  difficulty_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  category text not null,
  topic text not null,
  content jsonb not null,
  source text not null default 'built-in',
  status text not null default 'Approved',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  mode text not null,
  score integer not null,
  total integer not null,
  accuracy integer not null,
  category_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id text not null,
  label text default 'Review Later',
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.analytics (
  user_id uuid primary key references public.users(id) on delete cascade,
  questions_answered integer not null default 0,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  accuracy_rate numeric not null default 0,
  average_response_time numeric not null default 0,
  mock_exams_completed integer not null default 0,
  mastery_tests_passed integer not null default 0,
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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'Admin'
  );
$$;

drop policy if exists "users read own or admin" on public.users;
drop policy if exists "users insert own" on public.users;
drop policy if exists "profiles read own or admin" on public.user_profiles;
drop policy if exists "profiles insert own" on public.user_profiles;
drop policy if exists "profiles update own safe fields" on public.user_profiles;
drop policy if exists "profiles admin update" on public.user_profiles;
drop policy if exists "progress own" on public.user_progress;
drop policy if exists "question bank readable" on public.question_bank;
drop policy if exists "question bank admin write" on public.question_bank;
drop policy if exists "lessons readable" on public.lessons;
drop policy if exists "lessons admin write" on public.lessons;
drop policy if exists "mock exams own or admin" on public.mock_exams;
drop policy if exists "bookmarks own" on public.bookmarks;
drop policy if exists "analytics own or admin" on public.analytics;
drop policy if exists "login history own or admin" on public.login_history;
drop policy if exists "device sessions own or admin" on public.device_sessions;

create policy "users read own or admin" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users insert own" on public.users for insert with check (id = auth.uid());
create policy "profiles read own or admin" on public.user_profiles for select using (user_id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.user_profiles for insert with check (user_id = auth.uid());
create policy "profiles update own safe fields" on public.user_profiles
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status = (select status from public.user_profiles where user_id = auth.uid())
  and role = (select role from public.user_profiles where user_id = auth.uid())
);

create policy "profiles admin update" on public.user_profiles
for update
using (public.is_admin())
with check (public.is_admin());
create policy "progress own" on public.user_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "question bank readable" on public.question_bank for select using (status = 'Approved' or public.is_admin());
create policy "question bank admin write" on public.question_bank for all using (public.is_admin()) with check (public.is_admin());
create policy "lessons readable" on public.lessons for select using (status = 'Approved' or public.is_admin());
create policy "lessons admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "mock exams own or admin" on public.mock_exams for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "bookmarks own" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "analytics own or admin" on public.analytics for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "login history own or admin" on public.login_history for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "device sessions own or admin" on public.device_sessions for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.question_bank, public.lessons to anon, authenticated;
grant insert, update, delete on public.question_bank, public.lessons to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_profiles (user_id, full_name, gmail_address, status, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'Trial Active', 'Student')
  on conflict (user_id) do nothing;

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
