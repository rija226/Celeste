import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_UNLOCKED_COUNT_KEY = 'celeste-last-unlocked-count';
const LAST_CELEBRATED_STREAK_KEY = 'celeste-last-celebrated-streak';

// Broj cvorova koji nisu zakljucani (zavrseni + trenutni) u trenutku kad je
// korisnik zadnji put vidio Home putanju -- koristi se da otkrijemo da li se
// desilo novo otkljucavanje otkad je korisnik zadnji put bio tu.
export async function getLastUnlockedCount(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(LAST_UNLOCKED_COUNT_KEY);
  return stored === null ? null : Number(stored);
}

export async function setLastUnlockedCount(count: number): Promise<void> {
  await AsyncStorage.setItem(LAST_UNLOCKED_COUNT_KEY, String(count));
}

// Najduzi streak za koji je proslava vec prikazana -- sprjecava ponovni
// prikaz za isti broj dana (npr. dva zavrsetka sesije istog dana).
export async function getLastCelebratedStreak(): Promise<number> {
  const stored = await AsyncStorage.getItem(LAST_CELEBRATED_STREAK_KEY);
  return stored === null ? 0 : Number(stored);
}

export async function setLastCelebratedStreak(streak: number): Promise<void> {
  await AsyncStorage.setItem(LAST_CELEBRATED_STREAK_KEY, String(streak));
}
