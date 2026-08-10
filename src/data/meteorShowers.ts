import type { LocalizedText } from '@/types/models';

export type MonthDay = { month: number; day: number };

export type MeteorShower = {
  slug: string;
  name: LocalizedText;
  radiant: LocalizedText;
  zhr: number;
  activeStart: MonthDay;
  activeEnd: MonthDay;
  peak: MonthDay;
};

// Datumi su tipicni prosjeci koji se ponavljaju svake godine (par dana
// varijacije je normalno) -- staticki podaci, bez potrebe za API-jem ili
// bazom (vidi CLAUDE.md: ne uvoditi nepotrebnu infrastrukturu).
export const METEOR_SHOWERS: MeteorShower[] = [
  {
    slug: 'quadrantids',
    name: { en: 'Quadrantids', hr: 'Kvadrantidi' },
    radiant: { en: 'Boötes', hr: 'Volar' },
    zhr: 120,
    activeStart: { month: 12, day: 28 },
    activeEnd: { month: 1, day: 12 },
    peak: { month: 1, day: 3 },
  },
  {
    slug: 'lyrids',
    name: { en: 'Lyrids', hr: 'Liridi' },
    radiant: { en: 'Lyra', hr: 'Lira' },
    zhr: 18,
    activeStart: { month: 4, day: 15 },
    activeEnd: { month: 4, day: 29 },
    peak: { month: 4, day: 22 },
  },
  {
    slug: 'eta-aquariids',
    name: { en: 'Eta Aquariids', hr: 'Eta Akvaridi' },
    radiant: { en: 'Aquarius', hr: 'Vodolija' },
    zhr: 50,
    activeStart: { month: 4, day: 15 },
    activeEnd: { month: 5, day: 27 },
    peak: { month: 5, day: 5 },
  },
  {
    slug: 'delta-aquariids',
    name: { en: 'Delta Aquariids', hr: 'Delta Akvaridi' },
    radiant: { en: 'Aquarius', hr: 'Vodolija' },
    zhr: 20,
    activeStart: { month: 7, day: 12 },
    activeEnd: { month: 8, day: 23 },
    peak: { month: 7, day: 30 },
  },
  {
    slug: 'perseids',
    name: { en: 'Perseids', hr: 'Perseidi' },
    radiant: { en: 'Perseus', hr: 'Perzej' },
    zhr: 100,
    activeStart: { month: 7, day: 14 },
    activeEnd: { month: 9, day: 1 },
    peak: { month: 8, day: 12 },
  },
  {
    slug: 'orionids',
    name: { en: 'Orionids', hr: 'Orionidi' },
    radiant: { en: 'Orion', hr: 'Orion' },
    zhr: 20,
    activeStart: { month: 9, day: 26 },
    activeEnd: { month: 11, day: 22 },
    peak: { month: 10, day: 21 },
  },
  {
    slug: 'leonids',
    name: { en: 'Leonids', hr: 'Leonidi' },
    radiant: { en: 'Leo', hr: 'Lav' },
    zhr: 15,
    activeStart: { month: 11, day: 3 },
    activeEnd: { month: 12, day: 2 },
    peak: { month: 11, day: 17 },
  },
  {
    slug: 'geminids',
    name: { en: 'Geminids', hr: 'Geminidi' },
    radiant: { en: 'Gemini', hr: 'Blizanci' },
    zhr: 150,
    activeStart: { month: 11, day: 19 },
    activeEnd: { month: 12, day: 24 },
    peak: { month: 12, day: 14 },
  },
  {
    slug: 'ursids',
    name: { en: 'Ursids', hr: 'Ursidi' },
    radiant: { en: 'Ursa Minor', hr: 'Mali medvjed' },
    zhr: 10,
    activeStart: { month: 12, day: 13 },
    activeEnd: { month: 12, day: 24 },
    peak: { month: 12, day: 22 },
  },
];

function toComparable({ month, day }: MonthDay): number {
  return month * 100 + day;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isActiveOn(shower: MeteorShower, date: Date): boolean {
  const today = toComparable({ month: date.getMonth() + 1, day: date.getDate() });
  const start = toComparable(shower.activeStart);
  const end = toComparable(shower.activeEnd);
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

function nextPeakDate(shower: MeteorShower, from: Date): Date {
  const year = from.getFullYear();
  const thisYearPeak = new Date(year, shower.peak.month - 1, shower.peak.day);
  return thisYearPeak >= startOfDay(from) ? thisYearPeak : new Date(year + 1, shower.peak.month - 1, shower.peak.day);
}

export function getActiveShowers(date: Date = new Date()): MeteorShower[] {
  return METEOR_SHOWERS.filter((shower) => isActiveOn(shower, date));
}

export function getNextShower(date: Date = new Date()): { shower: MeteorShower; peakDate: Date } | null {
  if (METEOR_SHOWERS.length === 0) return null;
  return METEOR_SHOWERS.map((shower) => ({ shower, peakDate: nextPeakDate(shower, date) })).sort(
    (a, b) => a.peakDate.getTime() - b.peakDate.getTime(),
  )[0];
}
