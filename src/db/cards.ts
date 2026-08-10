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

export async function getCardBySlug(slug: string): Promise<Card | null> {
  const { data, error } = await supabase.from('cards').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? mapCardRow(data as CardRow) : null;
}

export async function getCardsBySlugs(slugs: string[]): Promise<Card[]> {
  if (slugs.length === 0) return [];
  const { data, error } = await supabase.from('cards').select('*').in('slug', slugs);
  if (error) throw error;
  return (data as CardRow[]).map(mapCardRow);
}
