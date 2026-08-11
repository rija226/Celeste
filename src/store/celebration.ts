import { create } from 'zustand';

export type CelebrationKind = 'streak' | 'deckComplete' | 'dailyGoal';

export type Celebration = { kind: CelebrationKind; streakCount?: number };

type CelebrationState = {
  queue: Celebration[];
  celebrate: (celebration: Celebration) => void;
  dismiss: () => void;
};

// Jedan dijeljeni mehanizam za sve "trenutke nagrade" (streak, zavrsen deck,
// dnevni cilj) -- bilo koji ekran moze pozvati celebrate(), CelebrationToast
// (montiran jednom u root layout-u) prikazuje odgovarajuci tekst i efekat.
// Red cekanja (ne jedan slot) jer se npr. streak i "sve za danas" mogu desiti
// u istom trenutku -- nijedna proslava se ne izgubi, samo se prikazu redom.
export const useCelebrationStore = create<CelebrationState>((set) => ({
  queue: [],
  celebrate: (celebration) => set((state) => ({ queue: [...state.queue, celebration] })),
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
