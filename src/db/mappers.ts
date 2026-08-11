import type {
  Card,
  CardProgress,
  CardStyle,
  Constellation,
  ConstellationLine,
  ConstellationStar,
  Deck,
  LocalizedText,
  QuizDifficulty,
  QuizMode,
  QuizResult,
  ReviewLog,
} from '@/types/models';

export type DeckRow = {
  id: string;
  slug: string;
  category: string;
  is_premium: boolean;
  level: number | null;
  xp_required: number;
  emoji: string | null;
  name: LocalizedText;
  description: LocalizedText;
  created_at: string;
  updated_at: string;
};

export type CardRow = {
  id: string;
  slug: string | null;
  deck_id: string;
  style: CardStyle;
  front: LocalizedText;
  back: LocalizedText;
  explanation: LocalizedText | null;
  image_url: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CardProgressRow = {
  id: string;
  user_id: string;
  card_id: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

export type ReviewLogRow = {
  id: string;
  user_id: string;
  card_id: string;
  rating: number;
  reviewed_at: string;
  elapsed_days: number;
};

export function mapDeckRow(row: DeckRow): Deck {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    isPremium: row.is_premium,
    level: row.level,
    xpRequired: row.xp_required,
    emoji: row.emoji,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    slug: row.slug,
    deckId: row.deck_id,
    style: row.style,
    front: row.front,
    back: row.back,
    explanation: row.explanation,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCardProgressRow(row: CardProgressRow): CardProgress {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    lastReview: row.last_review,
  };
}

export function mapReviewLogRow(row: ReviewLogRow): ReviewLog {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    rating: row.rating,
    reviewedAt: row.reviewed_at,
    elapsedDays: row.elapsed_days,
  };
}

export type ConstellationRow = {
  id: string;
  slug: string;
  name: LocalizedText;
  facts: LocalizedText;
  difficulty: QuizDifficulty;
  stars: ConstellationStar[];
  lines: ConstellationLine[];
};

export function mapConstellationRow(row: ConstellationRow): Constellation {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    facts: row.facts,
    difficulty: row.difficulty,
    stars: row.stars,
    lines: row.lines,
  };
}

export type QuizResultRow = {
  id: string;
  user_id: string;
  constellation_id: string;
  mode: QuizMode;
  difficulty: QuizDifficulty;
  is_correct: boolean;
  points: number;
  answered_at: string;
};

export function mapQuizResultRow(row: QuizResultRow): QuizResult {
  return {
    id: row.id,
    userId: row.user_id,
    constellationId: row.constellation_id,
    mode: row.mode,
    difficulty: row.difficulty,
    isCorrect: row.is_correct,
    points: row.points,
    answeredAt: row.answered_at,
  };
}
