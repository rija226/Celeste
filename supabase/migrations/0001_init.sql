-- Faza 1: decks, cards, card_progress, review_logs (vidi CLAUDE.md za model)
-- user_id u card_progress/review_logs referencira auth.users preko Supabase
-- Anonymous Auth (dogovoreno u Checkpointu 4 -- pre Faze 4 nema pravog login-a).

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  is_premium boolean not null default false,
  name jsonb not null,
  description jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  style text not null,
  front jsonb not null,
  back jsonb not null,
  explanation jsonb,
  image_url text,
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cards_deck_id_idx on public.cards (deck_id);

create table public.card_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  due timestamptz not null default now(),
  stability real not null default 0,
  difficulty real not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state integer not null default 0,
  last_review timestamptz,
  unique (user_id, card_id)
);
create index card_progress_user_due_idx on public.card_progress (user_id, due);
create index card_progress_card_id_idx on public.card_progress (card_id);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  rating integer not null,
  reviewed_at timestamptz not null default now(),
  elapsed_days integer not null default 0
);
create index review_logs_user_id_idx on public.review_logs (user_id);
create index review_logs_card_id_idx on public.review_logs (card_id);

-- RLS: sadrzaj (decks/cards) je javno citljiv; progress/logovi su privatni po korisniku.
-- Pisanje u decks/cards ide samo preko service_role kljuca (import skripta), koji zaobilazi RLS.

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.card_progress enable row level security;
alter table public.review_logs enable row level security;

create policy decks_read on public.decks
  for select to anon, authenticated
  using (true);

create policy cards_read on public.cards
  for select to anon, authenticated
  using (true);

create policy card_progress_owner on public.card_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy review_logs_select_own on public.review_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy review_logs_insert_own on public.review_logs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
