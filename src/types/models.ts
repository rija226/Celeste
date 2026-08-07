export type LocalizedText = {
  en: string;
  hr: string;
};

export type CardStyle = 'term' | 'qa' | 'fact' | 'scale';

export type Deck = {
  id: string;
  slug: string;
  category: string;
  isPremium: boolean;
  name: LocalizedText;
  description: LocalizedText;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: string;
  deckId: string;
  style: CardStyle;
  front: LocalizedText;
  back: LocalizedText;
  explanation: LocalizedText | null;
  imageUrl: string | null;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardProgress = {
  id: string;
  userId: string;
  cardId: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: string | null;
};

export type ReviewLog = {
  id: string;
  userId: string;
  cardId: string;
  rating: number;
  reviewedAt: string;
  elapsedDays: number;
};
