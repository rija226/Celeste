import { supabase } from './supabase';

/**
 * Faza 1 nema pravi login (Faza 4). Svaki uredjaj dobija anonimnu Supabase
 * sesiju cim se pokrene app -- to je user_id koji RLS politike koriste za
 * card_progress/review_logs. U Fazi 4 se ovaj nalog moze upgrade-ovati na
 * pravi (linkIdentity) bez gubitka podataka.
 */
let pendingSession: Promise<string> | null = null;

// Vise ekrana/efekata poziva ensureSession() na hladnom startu (root layout
// + svaki ekran). Bez dedupe-a, konkurentni pozivi prije nego sesija postoji
// svaki vide "nema sesije" i svaki pokusa signInAnonymously() -- dupli
// signup zna izazvati neobjasnjivu gresku. Dijeli isti in-flight promise.
export async function ensureSession(): Promise<string> {
  if (pendingSession) return pendingSession;

  pendingSession = (async () => {
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) {
      return existing.session.user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      throw error ?? new Error('Anonymous sign-in failed');
    }
    return data.session.user.id;
  })();

  try {
    return await pendingSession;
  } finally {
    pendingSession = null;
  }
}

export type AuthUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
};

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, isAnonymous: user.is_anonymous ?? false };
}

// Nadogradnja anonimnog naloga na pravi -- ISTI user_id, sav dosadasnji
// progress ostaje netaknut. "Confirm email" je ukljucen na projektu, pa
// nalog ostaje anoniman dok korisnik ne klikne link u potvrdnom emailu.
export async function upgradeAnonymousAccount(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}

// Prijava na POSTOJECI nalog -- ovo MIJENJA sesiju na taj nalog i napusta
// trenutni anonimni identitet (i njegov progress) ako je postojao. Poziv na
// UI nivou treba jasno upozoriti korisnika na ovo prije prijave.
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
