import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SFX_STORAGE_KEY = 'astro-learn-sfx-enabled';
const AMBIENT_STORAGE_KEY = 'astro-learn-ambient-enabled';

type SoundState = {
  hydrated: boolean;
  sfxEnabled: boolean;
  ambientEnabled: boolean;
  hydrate: () => Promise<void>;
  setSfxEnabled: (enabled: boolean) => void;
  setAmbientEnabled: (enabled: boolean) => void;
};

// Efekti ON, ambijent OFF po defaultu (vidi obrazlozenje u planu) -- ove
// vrijednosti vaze dok se ne ucita AsyncStorage (hydrate se poziva jednom u
// root layout-u, uz i18n/session init).
export const useSoundStore = create<SoundState>((set) => ({
  hydrated: false,
  sfxEnabled: true,
  ambientEnabled: false,
  hydrate: async () => {
    const [sfx, ambient] = await Promise.all([
      AsyncStorage.getItem(SFX_STORAGE_KEY),
      AsyncStorage.getItem(AMBIENT_STORAGE_KEY),
    ]);
    set({
      sfxEnabled: sfx === null ? true : sfx === 'true',
      ambientEnabled: ambient === 'true',
      hydrated: true,
    });
  },
  setSfxEnabled: (enabled) => {
    set({ sfxEnabled: enabled });
    AsyncStorage.setItem(SFX_STORAGE_KEY, String(enabled));
  },
  setAmbientEnabled: (enabled) => {
    set({ ambientEnabled: enabled });
    AsyncStorage.setItem(AMBIENT_STORAGE_KEY, String(enabled));
  },
}));
