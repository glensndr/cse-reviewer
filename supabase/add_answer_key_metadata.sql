-- Adds metadata used by the reviewer answer-key extraction engine.
-- Safe to run multiple times in Supabase SQL Editor.

alter table public.question_bank
  add column if not exists confidence_score numeric not null default 0;

alter table public.question_bank
  add column if not exists answer_source text not null default 'pending_review';

