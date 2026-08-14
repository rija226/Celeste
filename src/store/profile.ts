import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const GLYPH_KEY = 'celeste-profile-glyph';
const ACCENT_KEY = 'celeste-profile-accent';
const NAME_KEY = 'celeste-profile-name';

export type AccentName = 'nebula' | 'aurora' | 'comet' | 'amber';

export const PROFILE_GLYPHS = ['🚀', '🪐', '🌙', '☄️', '🛰️', '🌌', '👨‍🚀', '🔭'];

const DEFAULT_GLYPH = '🪐';
const DEFAULT_ACCENT: AccentName = 'nebula';

type ProfileState = {
  hydrated: boolean;
  glyph: string;
  accent: AccentName;
  name: string;
  hydrate: () => Promise<void>;
  setGlyph: (glyph: string) => void;
  setAccent: (accent: AccentName) => void;
  setName: (name: string) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  hydrated: false,
  glyph: DEFAULT_GLYPH,
  accent: DEFAULT_ACCENT,
  name: '',
  hydrate: async () => {
    const [glyph, accent, name] = await Promise.all([
      AsyncStorage.getItem(GLYPH_KEY),
      AsyncStorage.getItem(ACCENT_KEY),
      AsyncStorage.getItem(NAME_KEY),
    ]);
    set({
      glyph: glyph ?? DEFAULT_GLYPH,
      accent: (accent as AccentName | null) ?? DEFAULT_ACCENT,
      name: name ?? '',
      hydrated: true,
    });
  },
  setGlyph: (glyph) => {
    set({ glyph });
    AsyncStorage.setItem(GLYPH_KEY, glyph);
  },
  setAccent: (accent) => {
    set({ accent });
    AsyncStorage.setItem(ACCENT_KEY, accent);
  },
  setName: (name) => {
    set({ name });
    AsyncStorage.setItem(NAME_KEY, name);
  },
}));
