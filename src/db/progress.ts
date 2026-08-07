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

export async function getDueCardProgress(userId: string): Promise<CardProgress[]> {
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .lte('due', new Date().toISOString())
    .order('due');
  if (error) throw error;
  return (data as CardProgressRow[]).map(mapCardProgressRow);
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
