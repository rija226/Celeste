-- Faza 2: constellations (kviz prepoznavanja sazvijezdja)
-- stars/lines su stilizovane (normalizovane 0-100 koordinate za SVG crtanje),
-- ne precizni astronomski podaci -- dovoljno za prepoznavanje oblika u kvizu.

create table public.constellations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null,
  facts jsonb not null,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  stars jsonb not null,
  lines jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.constellations enable row level security;

create policy constellations_read on public.constellations
  for select to anon, authenticated
  using (true);
