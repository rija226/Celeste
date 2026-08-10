-- Faza 2 Checkpoint 4: quiz_results (statistika kviza + gamifikacija)
-- Jedan red po odgovorenom pitanju (isti obrazac kao review_logs za kartice).

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  constellation_id uuid not null references public.constellations (id) on delete cascade,
  mode text not null check (mode in ('practice', 'daily')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  is_correct boolean not null,
  points integer not null default 0,
  answered_at timestamptz not null default now()
);

create index quiz_results_user_answered_idx on public.quiz_results (user_id, answered_at);
create index quiz_results_constellation_id_idx on public.quiz_results (constellation_id);

alter table public.quiz_results enable row level security;

create policy quiz_results_select_own on public.quiz_results
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy quiz_results_insert_own on public.quiz_results
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
