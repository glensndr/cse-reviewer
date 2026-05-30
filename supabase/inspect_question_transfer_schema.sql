-- Run this in Supabase SQL Editor to inspect the actual production schema used by transfers.
-- It reports question_bank, imported_questions, and approved_questions columns, plus policies.

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('question_bank', 'imported_questions', 'approved_questions')
order by table_name, ordinal_position;

select
  table_name,
  count(*) as column_count
from information_schema.columns
where table_schema = 'public'
  and table_name in ('question_bank', 'imported_questions', 'approved_questions')
group by table_name
order by table_name;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('question_bank', 'imported_questions', 'approved_questions')
order by tablename, policyname;

select
  user_id,
  gmail_address,
  status,
  role
from public.user_profiles
where lower(gmail_address) = lower('glensndr@gmail.com');
