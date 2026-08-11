-- Level-path fields on decks: level nizova odredjuje redoslijed na putanji,
-- xp_required prag za otkljucavanje, emoji ikonu cvora (bez izmjene koda za nove nivoe).
alter table public.decks
  add column level integer,
  add column xp_required integer not null default 0,
  add column emoji text;

create unique index decks_level_key on public.decks (level) where level is not null;
