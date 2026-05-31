-- Persistent reviewer-assisted AI draft storage.
-- Run in Supabase SQL Editor before using "Generate 10 Drafts from Reviewer Concepts".

create table if not exists public.reviewer_ai_drafts (
  id text primary key,
  created_at timestamptz not null default now(),
  source_reviewer text not null,
  source_concept text not null,
  category text not null,
  topic text not null,
  difficulty text not null,
  question text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_answer text not null,
  explanation text not null,
  status text not null default 'Draft',
  generated_by text,
  approved_by text,
  approved_at timestamptz
);

create index if not exists reviewer_ai_drafts_status_idx on public.reviewer_ai_drafts (status, created_at desc);
create index if not exists reviewer_ai_drafts_category_topic_idx on public.reviewer_ai_drafts (category, topic);
create index if not exists reviewer_ai_drafts_source_idx on public.reviewer_ai_drafts (source_reviewer);

alter table public.reviewer_ai_drafts enable row level security;

drop policy if exists "reviewer ai drafts admin only" on public.reviewer_ai_drafts;

create policy "reviewer ai drafts admin only" on public.reviewer_ai_drafts
for all
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.reviewer_ai_drafts to authenticated;

