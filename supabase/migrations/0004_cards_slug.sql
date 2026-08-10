-- Faza 3 Checkpoint 4: stabilna referenca na karticu (za "objekt na nebu ->
-- povezana kartica"). Nullable + unique -- vise NULL vrijednosti je ok pod
-- standardnim unique constraintom u Postgresu, pa ne treba backfill odmah.
alter table public.cards add column slug text unique;
