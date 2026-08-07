import type { Deck } from '@/types/models';

import { mapDeckRow, type DeckRow } from './mappers';
import { supabase } from './supabase';

export async function getDecks(): Promise<Deck[]> {
  const { data, error } = await supabase.from('decks').select('*').order('created_at');
  if (error) throw error;
  return (data as DeckRow[]).map(mapDeckRow);
}

export async function getDeck(id: string): Promise<Deck | null> {
  const { data, error } = await supabase.from('decks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapDeckRow(data as DeckRow) : null;
}
