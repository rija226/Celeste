import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_STORAGE_KEY = 'celeste-welcome-seen';

export async function hasSeenWelcome(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(WELCOME_STORAGE_KEY);
  return stored === 'true';
}

export async function markWelcomeSeen(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_STORAGE_KEY, 'true');
}
