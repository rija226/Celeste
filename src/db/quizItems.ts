import type { QuizItem } from '@/types/models';

import { mapQuizItemRow, type QuizItemRow } from './mappers';
import { supabase } from './supabase';

export async function getQuizItems(): Promise<QuizItem[]> {
  const { data, error } = await supabase.from('quiz_items').select('*');
  if (error) throw error;
  return (data as QuizItemRow[]).map(mapQuizItemRow);
}
