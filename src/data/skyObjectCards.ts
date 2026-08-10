import type { SkyBodyKey } from '@/lib/astronomy';

// Faza 3 Checkpoint 4: "objekt na nebu -> povezana kartica". Slug-ovi su
// card.id iz deck-space-basics.json (vidi backfill-card-slugs.js), izabrani
// kao onaj koji direktno govori o tom tijelu (npr. "Why is Mars red?").
export const SKY_BODY_CARD_SLUG: Partial<Record<SkyBodyKey, string>> = {
  moon: 'sb-014',
  mercury: 'sb-011',
  venus: 'sb-019',
  mars: 'sb-008',
  jupiter: 'sb-005',
  saturn: 'sb-028',
};
