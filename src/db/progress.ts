import type { CardProgress, ReviewLog } from '@/types/models';

import { mapCardProgressRow, type CardProgressRow } from './mappers';
import { supabase } from './supabase';

export async function getCardProgress(userId: string, cardId: string): Promise<CardProgress | null> {
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCardProgressRow(data as CardProgressRow) : null;
}

export async function getCardProgressForCards(
  userId: string,
  cardIds: string[],
): Promise<CardProgress[]> {
  if (cardIds.length === 0) return [];
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .in('card_id', cardIds);
  if (error) throw error;
  return (data as CardProgressRow[]).map(mapCardProgressRow);
}

export async function getLearnedCardCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('card_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('reps', 0);
  if (error) throw error;
  return count ?? 0;
}

export async function upsertCardProgress(
  progress: Omit<CardProgress, 'id'>,
): Promise<void> {
  const row = {
    user_id: progress.userId,
    card_id: progress.cardId,
    due: progress.due,
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsedDays,
    scheduled_days: progress.scheduledDays,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.state,
    last_review: progress.lastReview,
  };
  const { error } = await supabase.from('card_progress').upsert(row, { onConflict: 'user_id,card_id' });
  if (error) throw error;
}

export async function insertReviewLog(log: Omit<ReviewLog, 'id'>): Promise<void> {
  const row = {
    user_id: log.userId,
    card_id: log.cardId,
    rating: log.rating,
    reviewed_at: log.reviewedAt,
    elapsed_days: log.elapsedDays,
  };
  const { error } = await supabase.from('review_logs').insert(row);
  if (error) throw error;
}

// Koliko od datih kartica je due (bez progresa ili due <= sada).
export async function getDueCount(userId: string, cardIds: string[]): Promise<number> {
  if (cardIds.length === 0) return 0;
  const progress = await getCardProgressForCards(userId, cardIds);
  const progressByCardId = new Map(progress.map((p) => [p.cardId, p]));
  const now = new Date();
  return cardIds.filter((id) => {
    const p = progressByCardId.get(id);
    return !p || new Date(p.due) <= now;
  }).length;
}

export async function getTotalReviewCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('review_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function getReviewLogDates(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('review_logs')
    .select('reviewed_at')
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false });
  if (error) throw error;
  return (data as { reviewed_at: string }[]).map((row) => row.reviewed_at);
}
