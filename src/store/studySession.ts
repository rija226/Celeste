import { create } from 'zustand';

import type { Card } from '@/types/models';

type StudySessionState = {
  queue: Card[];
  index: number;
  isFlipped: boolean;
  start: (cards: Card[]) => void;
  flip: () => void;
  unflip: () => void;
  advanceIndex: () => void;
};

export const useStudySessionStore = create<StudySessionState>((set) => ({
  queue: [],
  index: 0,
  isFlipped: false,
  start: (cards) => set({ queue: cards, index: 0, isFlipped: false }),
  flip: () => set((state) => ({ isFlipped: !state.isFlipped })),
  unflip: () => set({ isFlipped: false }),
  // Namjerno odvojeno od unflip() -- pozivalac odgadja advanceIndex() do
  // trenutka kad je flip animacija na pola okreta (obje strane kartice
  // nevidljive), da se sadrzaj sljedece kartice nikad ne vidi "krajičkom oka"
  // dok se prethodna kartica jos vidljivo okrece nazad.
  advanceIndex: () => set((state) => ({ index: state.index + 1 })),
}));
