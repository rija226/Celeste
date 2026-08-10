import type { QuizResult } from '@/types/models';

import { supabase } from './supabase';

export async function insertQuizResult(result: Omit<QuizResult, 'id'>): Promise<void> {
  const row = {
    user_id: result.userId,
    constellation_id: result.constellationId,
    mode: result.mode,
    difficulty: result.difficulty,
    is_correct: result.isCorrect,
    points: result.points,
    answered_at: result.answeredAt,
  };
  const { error } = await supabase.from('quiz_results').insert(row);
  if (error) throw error;
}

export async function getQuizPoints(userId: string): Promise<number> {
  const { data, error } = await supabase.from('quiz_results').select('points').eq('user_id', userId);
  if (error) throw error;
  return (data as { points: number }[]).reduce((sum, row) => sum + row.points, 0);
}

export async function getQuizResultDates(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });
  if (error) throw error;
  return (data as { answered_at: string }[]).map((row) => row.answered_at);
}
