import type { ReactNode } from 'react';
import { YStack } from 'tamagui';

import { SpaceBackdrop } from './SpaceBackdrop';

// Expo Router (Tabs i Stack) na webu drzi vise ekrana montiranih istovremeno
// i slaze ih preko z-index-a umjesto display:none, pa prozirna scena "procuri"
// kroz neaktivne. Svaki ekran zato crta svoju kopiju pozadine (deterministicna,
// izgleda identicno jednoj dijeljenoj instanci) umjesto da se osloni na jednu
// zajednicku providnu pozadinu iza navigatora.
export function ScreenBackdrop({ children }: { children: ReactNode }) {
  return (
    <YStack f={1}>
      <SpaceBackdrop />
      {children}
    </YStack>
  );
}
