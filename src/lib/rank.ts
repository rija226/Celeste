// Nivo -> naziv "ranga" -- cisto kozmeticki label izveden iz nivoa (ne
// sprema se nigdje). Niz ima 5 stepenica za do 9 nivoa (broj deckova);
// zadnja se ponavlja za sve visoke nivoe.
const RANK_KEYS = ['novice', 'novice', 'explorer', 'voyager', 'voyager', 'stargazer', 'stargazer', 'cosmonaut', 'cosmonaut'] as const;

export function getRankKey(level: number): string {
  return RANK_KEYS[Math.min(Math.max(level, 1) - 1, RANK_KEYS.length - 1)];
}
