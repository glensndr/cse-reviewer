-- Civil Service Reviewer authentication diagnostics
-- Run this in Supabase SQL Editor while logged in as the project owner.
-- Target user: glensndr@gmail.com

-- 1. Confirm required public tables exist.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'user_profiles',
    'user_progress',
    'question_bank',
    'lessons',
    'mock_exams',
    'bookmarks',
    'analytics',
    'login_history',
    'device_sessions'
  )
order by table_name;

-- 2. Inspect the Supabase Authentication user.
select id, email, created_at, last_sign_in_at, raw_user_meta_data
from auth.users
where lower(email) = lower('glensndr@gmail.com');

-- 3. Inspect the mirrored app user row.
select *
from public.users
where lower(email) = lower('glensndr@gmail.com');

-- 4. Inspect the licensing/profile row. This is the main access-control row.
select
  user_id,
  full_name,
  gmail_address,
  registration_date,
  last_login,
  status,
  role,
  trial_started_at,
  trial_expires_at,
  now() as server_time,
  trial_expires_at > now() as trial_active_now,
  updated_at
from public.user_profiles
where lower(gmail_address) = lower('glensndr@gmail.com');

-- 5. Find auth users that are missing public.users or user_profiles rows.
select au.id, au.email, au.created_at, pu.id as app_user_id, up.user_id as profile_user_id
from auth.users au
left join public.users pu on pu.id = au.id
left join public.user_profiles up on up.user_id = au.id
where lower(au.email) = lower('glensndr@gmail.com')
  and (pu.id is null or up.user_id is null);

-- 6. Find orphaned app/profile rows that no longer have matching auth users.
select 'users' as source, pu.id as user_id, pu.email
from public.users pu
left join auth.users au on au.id = pu.id
where au.id is null
union all
select 'user_profiles' as source, up.user_id, up.gmail_address as email
from public.user_profiles up
left join auth.users au on au.id = up.user_id
where au.id is null;

-- 7. Inspect progress and analytics rows.
select user_id, updated_at, jsonb_typeof(app_state) as app_state_type, app_state <> '{}'::jsonb as has_app_state
from public.user_progress
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'));

select *
from public.analytics
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'));

-- 8. Inspect licensing activity: login history and active devices.
select *
from public.login_history
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'))
order by created_at desc
limit 50;

select *
from public.device_sessions
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'))
order by last_login desc;

-- 9. Inspect bookmarks and exam result tables for this user.
select *
from public.bookmarks
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'))
order by created_at desc
limit 50;

select *
from public.mock_exams
where user_id in (select id from auth.users where lower(email) = lower('glensndr@gmail.com'))
order by created_at desc
limit 50;

-- 10. Inspect RLS enablement and policies for app tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'users',
    'user_profiles',
    'user_progress',
    'question_bank',
    'lessons',
    'mock_exams',
    'bookmarks',
    'analytics',
    'login_history',
    'device_sessions'
  )
order by tablename;

select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'users',
    'user_profiles',
    'user_progress',
    'question_bank',
    'lessons',
    'mock_exams',
    'bookmarks',
    'analytics',
    'login_history',
    'device_sessions'
  )
order by tablename, policyname;

-- 11. Inspect the auth trigger that should create app rows after first signup.
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';

-- 12. Manual repair if auth.users exists but public rows are missing.
-- Uncomment only if query #5 reports missing app rows.
/*
insert into public.users (id, email, full_name, created_at)
select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), created_at
from auth.users
where lower(email) = lower('glensndr@gmail.com')
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
where lower(email) = lower('glensndr@gmail.com')
on conflict (user_id) do update
set full_name = excluded.full_name,
    gmail_address = excluded.gmail_address,
    last_login = now(),
    updated_at = now();

insert into public.user_progress (user_id, app_state)
select id, '{}'::jsonb
from auth.users
where lower(email) = lower('glensndr@gmail.com')
on conflict (user_id) do nothing;

insert into public.analytics (user_id)
select id
from auth.users
where lower(email) = lower('glensndr@gmail.com')
on conflict (user_id) do nothing;
*/

-- 13. Optional admin/full-access updates.
-- Uncomment only when you intentionally want this account to be admin or approved.
/*
update public.user_profiles
set status = 'Approved', updated_at = now()
where lower(gmail_address) = lower('glensndr@gmail.com');

update public.user_profiles
set role = 'Admin', updated_at = now()
where lower(gmail_address) = lower('glensndr@gmail.com');
*/
