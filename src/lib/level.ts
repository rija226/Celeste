// Trougaoni XP krug: nivo N pocinje na 5*N*(N-1) kumulativnog XP-a, pa svaki
// sljedeci nivo trazi 10 XP-a vise od prethodnog (10, 20, 30, 40...).
export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

function xpForLevel(level: number): number {
  return 5 * level * (level - 1);
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return {
    level,
    xpIntoLevel: xp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
  };
}
