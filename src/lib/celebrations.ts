import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_UNLOCKED_COUNT_KEY = 'celeste-last-unlocked-count';

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
