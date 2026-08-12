import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';

import type { CardProgress, ReviewLog } from '@/types/models';

export { Rating, State };

// Bez kratkorocnih "learning steps" (1m/10m...) -- FSRS sam racuna raspored
// od prvog pregleda. Ovo namjerno drzi Card.learning_steps uvijek na 0, jer
// card_progress (model iz CLAUDE.md) tu kolonu ne cuva.
const scheduler = fsrs({ learning_steps: [] });

function toFsrsCard(progress: CardProgress | null): Card {
  if (!progress) {
    return createEmptyCard();
  }
  return {
    due: new Date(progress.due),
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsedDays,
    scheduled_days: progress.scheduledDays,
    learning_steps: 0,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.state,
    last_review: progress.lastReview ? new Date(progress.lastReview) : undefined,
  };
}

export type ScheduledReview = {
  progress: Omit<CardProgress, 'id'>;
  reviewLog: Omit<ReviewLog, 'id'>;
};

// Za prikaz predvidjenog intervala ispod dugmadi ocjene, PRIJE nego korisnik
// klikne -- repeat() vraca ishod za sva 4 ocjene odjednom, bez upisa u bazu.
export function previewIntervals(
  progress: CardProgress | null,
  now: Date = new Date(),
): Record<Rating.Again | Rating.Hard | Rating.Good | Rating.Easy, number> {
  const card = toFsrsCard(progress);
  const record = scheduler.repeat(card, now);
  return {
    [Rating.Again]: record[Rating.Again].card.due.getTime() - now.getTime(),
    [Rating.Hard]: record[Rating.Hard].card.due.getTime() - now.getTime(),
    [Rating.Good]: record[Rating.Good].card.due.getTime() - now.getTime(),
    [Rating.Easy]: record[Rating.Easy].card.due.getTime() - now.getTime(),
  };
}

export type IntervalUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

export function formatIntervalFromMs(ms: number): { unit: IntervalUnit; value: number } {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return { unit: 'minutes', value: minutes };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { unit: 'hours', value: hours };
  const days = Math.round(hours / 24);
  if (days < 30) return { unit: 'days', value: days };
  const months = Math.round(days / 30);
  if (months < 12) return { unit: 'months', value: months };
  return { unit: 'years', value: Math.round(days / 365) };
}

export function scheduleReview(
  progress: CardProgress | null,
  userId: string,
  cardId: string,
  rating: Grade,
  now: Date = new Date(),
): ScheduledReview {
  const card = toFsrsCard(progress);
  const { card: updated, log } = scheduler.next(card, now, rating);

  return {
    progress: {
      userId,
      cardId,
      due: updated.due.toISOString(),
      stability: updated.stability,
      difficulty: updated.difficulty,
      elapsedDays: updated.elapsed_days,
      scheduledDays: updated.scheduled_days,
      reps: updated.reps,
      lapses: updated.lapses,
      state: updated.state,
      lastReview: (updated.last_review ?? now).toISOString(),
    },
    reviewLog: {
      userId,
      cardId,
      rating: log.rating,
      reviewedAt: log.review.toISOString(),
      elapsedDays: log.elapsed_days,
    },
  };
}
