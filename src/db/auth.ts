import { supabase } from './supabase';

/**
 * Faza 1 nema pravi login (Faza 4). Svaki uredjaj dobija anonimnu Supabase
 * sesiju cim se pokrene app -- to je user_id koji RLS politike koriste za
 * card_progress/review_logs. U Fazi 4 se ovaj nalog moze upgrade-ovati na
 * pravi (linkIdentity) bez gubitka podataka.
 */
export async function ensureSession(): Promise<string> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) {
    return existing.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw error ?? new Error('Anonymous sign-in failed');
  }
  return data.session.user.id;
}
