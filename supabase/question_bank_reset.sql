-- CSE Mastery question-bank reset.
-- Run this in Supabase SQL Editor after confirming the local JSON backup exists.
-- This script preserves users, profiles, subscriptions, progress, analytics, achievements, and auth tables.

begin;

create extension if not exists "pgcrypto";

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

create table if not exists public.question_bank_emergency_backup (
  backup_id uuid not null default gen_random_uuid(),
  backed_up_at timestamptz not null default now(),
  original_id text,
  category text,
  sub_category text,
  difficulty text,
  question text,
  choices jsonb,
  answer text,
  explanation text,
  hint text,
  learning_tip text,
  source text,
  status text,
  tags jsonb,
  date_generated timestamptz,
  approved_by text,
  approved_at timestamptz,
  times_answered integer,
  correct_count integer,
  wrong_count integer,
  difficulty_score numeric,
  created_at timestamptz,
  original_row jsonb
);

insert into public.question_bank_emergency_backup (
  original_id,
  category,
  sub_category,
  difficulty,
  question,
  choices,
  answer,
  explanation,
  hint,
  learning_tip,
  source,
  status,
  tags,
  date_generated,
  approved_by,
  approved_at,
  times_answered,
  correct_count,
  wrong_count,
  difficulty_score,
  created_at,
  original_row
)
select
  id,
  category,
  sub_category,
  difficulty,
  question,
  choices,
  answer,
  explanation,
  hint,
  learning_tip,
  source,
  status,
  tags,
  date_generated,
  approved_by,
  approved_at,
  times_answered,
  correct_count,
  wrong_count,
  difficulty_score,
  created_at,
  to_jsonb(question_bank)
from public.question_bank;

delete from public.question_bank;

commit;

-- Validation:
-- select count(*) as active_question_bank_rows from public.question_bank;
-- select count(*) as backed_up_rows from public.question_bank_emergency_backup;
