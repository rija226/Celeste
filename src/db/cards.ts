import type { Card } from '@/types/models';

import { mapCardRow, type CardRow } from './mappers';
import { supabase } from './supabase';

export async function getCardsForDeck(deckId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at');
  if (error) throw error;
  return (data as CardRow[]).map(mapCardRow);
}
