-- Faza 4: prosirenje kviza -- planet_questions (prepoznavanje iz slike) i
-- knowledge_questions (pitanja iz gradiva). Ova dva tipa nisu sazvijezdja,
-- pa im treba generici model odvojen od constellations tabele.

create table public.quiz_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  quiz_type text not null check (quiz_type in ('planet', 'knowledge')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  topic text,
  question jsonb,
  answer jsonb not null,
  distractors jsonb not null,
  image_name text,
  deck_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_items enable row level security;

create policy quiz_items_read on public.quiz_items
  for select to anon, authenticated
  using (true);

-- quiz_results je do sad pretpostavljao da je svaki odgovor na sazvijezdje
-- (constellation_id NOT NULL). Sad moze biti i planet/knowledge stavka.
alter table public.quiz_results
  alter column constellation_id drop not null,
  add column quiz_type text not null default 'constellation' check (quiz_type in ('constellation', 'planet', 'knowledge')),
  add column quiz_item_id uuid references public.quiz_items (id) on delete cascade;

alter table public.quiz_results
  add constraint quiz_results_item_ref_check check (
    (quiz_type = 'constellation' and constellation_id is not null and quiz_item_id is null)
    or
    (quiz_type <> 'constellation' and quiz_item_id is not null and constellation_id is null)
  );
