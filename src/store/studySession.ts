import { create } from 'zustand';

import type { Card } from '@/types/models';

type StudySessionState = {
  queue: Card[];
  index: number;
  isFlipped: boolean;
  start: (cards: Card[]) => void;
  flip: () => void;
  advance: () => void;
};

export const useStudySessionStore = create<StudySessionState>((set) => ({
  queue: [],
  index: 0,
  isFlipped: false,
  start: (cards) => set({ queue: cards, index: 0, isFlipped: false }),
  flip: () => set((state) => ({ isFlipped: !state.isFlipped })),
  advance: () => set((state) => ({ index: state.index + 1, isFlipped: false })),
}));
