// Orbitalni elementi (TLE) ISS-a s CelesTraka -- besplatno, bez kljuca. CelesTrak
// osvjezava podatke svakih par sati i blokira klijente koji ih cesce povlace.
// https://celestrak.org/NORAD/documentation/gp-data-formats.php

const ISS_TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const CACHE_MS = 6 * 60 * 60 * 1000;

export type Tle = { line1: string; line2: string };

// ponytail: kes u memoriji (6 h); dijeljeni kes preko Supabasea kad korisnika bude puno
let cached: { at: number; tle: Tle } | null = null;

export async function getIssTle(): Promise<Tle> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.tle;
  const res = await fetch(ISS_TLE_URL);
  if (!res.ok) throw new Error(`CelesTrak ${res.status}`);
  const lines = (await res.text()).split(/\r?\n/).map((line) => line.trim());
  const line1 = lines.find((line) => line.startsWith('1 '));
  const line2 = lines.find((line) => line.startsWith('2 '));
  if (!line1 || !line2) throw new Error('CelesTrak: neocekivan format TLE-a');
  cached = { at: Date.now(), tle: { line1, line2 } };
  return cached.tle;
}
