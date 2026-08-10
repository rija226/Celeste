import type { Constellation } from '@/types/models';

import { mapConstellationRow, type ConstellationRow } from './mappers';
import { supabase } from './supabase';

export async function getConstellations(): Promise<Constellation[]> {
  const { data, error } = await supabase.from('constellations').select('*');
  if (error) throw error;
  return (data as ConstellationRow[]).map(mapConstellationRow);
}
