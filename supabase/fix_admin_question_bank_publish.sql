-- Run in Supabase SQL Editor if Admin Import says question bank transfer failed.
-- Purpose:
-- 1. Confirm glensndr@gmail.com is an Approved Admin.
-- 2. Ensure Admin users can insert/update approved question_bank rows.
-- 3. Verify the minimum question_bank columns used by the app exist.

create extension if not exists pgcrypto;

alter table public.question_bank add column if not exists source text not null default 'Imported';
alter table public.question_bank add column if not exists status text not null default 'Approved';
alter table public.question_bank add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.question_bank add column if not exists date_generated timestamptz;
alter table public.question_bank add column if not exists approved_by text;
alter table public.question_bank add column if not exists approved_at timestamptz;
alter table public.question_bank add column if not exists times_answered integer not null default 0;
alter table public.question_bank add column if not exists correct_count integer not null default 0;
alter table public.question_bank add column if not exists wrong_count integer not null default 0;
alter table public.question_bank add column if not exists difficulty_score numeric not null default 0;

insert into public.user_profiles (
  user_id,
  full_name,
  gmail_address,
  status,
  role,
  trial_started_at,
  trial_expires_at,
  last_login
)
select
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Admin'),
  au.email,
  'Approved',
  'Admin',
  now(),
  now() + interval '365 days',
  now()
from auth.users au
where lower(au.email) = lower('glensndr@gmail.com')
on conflict (user_id) do update set
  status = 'Approved',
  role = 'Admin',
  updated_at = now();

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
      and status = 'Approved'
  );
$$;

alter table public.question_bank enable row level security;

drop policy if exists "question bank readable" on public.question_bank;
drop policy if exists "question bank admin write" on public.question_bank;

create policy "question bank readable" on public.question_bank
for select using (status = 'Approved' or public.is_admin());

create policy "question bank admin write" on public.question_bank
for all using (public.is_admin()) with check (public.is_admin());

grant select on public.question_bank to anon, authenticated;
grant insert, update, delete on public.question_bank to authenticated;

select
  user_id,
  gmail_address,
  status,
  role,
  public.is_admin() as is_admin_for_current_session
from public.user_profiles
where lower(gmail_address) = lower('glensndr@gmail.com');

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'question_bank'
order by ordinal_position;
