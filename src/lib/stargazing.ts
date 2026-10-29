import { Body, Equator, Horizon, Observer, SearchAltitude } from 'astronomy-engine';

import type { CloudHour } from '@/db/weather';

import { getBodyPosition, getConstellationSkyPositions, SKY_BODY_KEYS, type SkyBodyKey } from './astronomy';

const HOUR_MS = 60 * 60 * 1000;

export type TimeWindow = { start: Date; end: Date };

export type NightHour = { time: Date; cloudCover: number; moonAltitude: number };

export type NightRating = { score: number; best: TimeWindow; cloudCover: number };

export type RatingLevel = 'excellent' | 'good' | 'fair' | 'poor';

// Mrak koji je u toku ili sljedeci: od astronomskog sumraka (Sunce -18°) do zore.
// Sjevernije od ~48,5° ljeti nema astronomskog mraka -- tada nauticki (-12°).
export function getDarkWindow(latitude: number, longitude: number, now: Date = new Date()): TimeWindow | null {
  const observer = new Observer(latitude, longitude, 0);
  for (const altitude of [-18, -12]) {
    const end = SearchAltitude(Body.Sun, observer, +1, now, 1, altitude);
    if (!end) continue;
    const start = SearchAltitude(Body.Sun, observer, -1, new Date(end.date.getTime() - 24 * HOUR_MS), 1, altitude);
    if (start) return { start: start.date, end: end.date };
  }
  return null;
}

// Sat 0-100: vedrina, umanjena kad je Mjesec iznad obzora (pun Mjesec -60%).
// ponytail: gruba heuristika bez svjetlosnog zagadjenja i seeinga -- to dolazi u Fazi 5
export function hourScore(hour: NightHour, moonFraction: number): number {
  const clear = 1 - hour.cloudCover / 100;
  const moon = hour.moonAltitude > 0 ? 1 - 0.6 * moonFraction : 1;
  return Math.round(100 * clear * moon);
}

// Koliko sat smije biti slabiji od najboljeg da jos ulazi u "najbolji termin".
const BEST_TOLERANCE = 10;

const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

// Najbolji termin = najbolji sat + susjedni uzastopni sati koji su najvise BEST_TOLERANCE slabiji;
// ocjena noci = prosjek tog termina. `hours` moraju biti uzastopni sati unutar `dark`.
export function rateNight(hours: NightHour[], moonFraction: number, dark: TimeWindow): NightRating | null {
  if (hours.length === 0) return null;
  const scores = hours.map((hour) => hourScore(hour, moonFraction));
  const peak = scores.indexOf(Math.max(...scores));
  let from = peak;
  let to = peak;
  while (from > 0 && scores[from - 1] >= scores[peak] - BEST_TOLERANCE) from--;
  while (to < scores.length - 1 && scores[to + 1] >= scores[peak] - BEST_TOLERANCE) to++;

  const start = Math.max(hours[from].time.getTime(), dark.start.getTime());
  const end = Math.min(hours[to].time.getTime() + HOUR_MS, dark.end.getTime());
  return {
    score: Math.round(average(scores.slice(from, to + 1))),
    best: { start: new Date(start), end: new Date(end) },
    cloudCover: Math.round(average(hours.slice(from, to + 1).map((hour) => hour.cloudCover))),
  };
}

export function getRatingLevel(score: number): RatingLevel {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'fair';
  return 'poor';
}

function moonAltitude(observer: Observer, date: Date): number {
  const equator = Equator(Body.Moon, date, observer, true, true);
  return Horizon(date, observer, equator.ra, equator.dec, 'normal').altitude;
}

export type TonightPlan = { dark: TimeWindow; rating: NightRating | null };

// Spaja prognozu (sati od MET Norway) s mrakom i Mjesecom. Bez prognoze vraca samo mrak.
export function planTonight(
  latitude: number,
  longitude: number,
  forecast: CloudHour[],
  moonFraction: number,
  now: Date = new Date(),
): TonightPlan | null {
  const dark = getDarkWindow(latitude, longitude, now);
  if (!dark) return null;
  const observer = new Observer(latitude, longitude, 0);
  // Usred noci se ocjenjuje samo ostatak noci.
  const remaining = { start: new Date(Math.max(dark.start.getTime(), now.getTime())), end: dark.end };
  const hours = forecast
    .filter((hour) => hour.time.getTime() > remaining.start.getTime() - HOUR_MS && hour.time < dark.end)
    .map((hour) => ({ ...hour, moonAltitude: moonAltitude(observer, hour.time) }));
  return { dark, rating: rateNight(hours, moonFraction, remaining) };
}

// Termin za koji se pravi lista "sta gledati": najbolji termin, a bez prognoze ostatak mraka.
export function getViewingWindow(plan: TonightPlan, now: Date = new Date()): TimeWindow {
  return plan.rating?.best ?? { start: new Date(Math.max(plan.dark.start.getTime(), now.getTime())), end: plan.dark.end };
}

type Peak = { time: Date; azimuth: number; altitude: number };

type BodyTarget = Peak & { kind: 'body'; key: SkyBodyKey; magnitude: number };
type ConstellationTarget = Peak & { kind: 'constellation'; slug: string };
export type ViewingTarget = BodyTarget | ConstellationTarget;

const SAMPLE_MS = 30 * 60 * 1000;
// Nisko iznad obzora gleda se kroz najvise zraka i izmaglice -- ispod ovoga ne preporucujemo.
const MIN_ALTITUDE = 15;
const MAX_CONSTELLATIONS = 4;

// Sta gledati u terminu: za svaki objekt trenutak kad je najvise (uzorak svakih 30 min).
// Redoslijed: planete po sjaju, Mjesec, pa do 4 najvisa sazvijezdja.
export function getViewingTargets(latitude: number, longitude: number, window: TimeWindow): ViewingTarget[] {
  const times: Date[] = [];
  for (let t = window.start.getTime(); t <= window.end.getTime(); t += SAMPLE_MS) times.push(new Date(t));
  if (times.length === 0) return [];

  const bodies = SKY_BODY_KEYS.map((key): BodyTarget => {
    const samples = times.map((time) => ({ time, ...getBodyPosition(key, latitude, longitude, time) }));
    const peak = samples.reduce((a, b) => (b.altitude > a.altitude ? b : a));
    return { kind: 'body', key, time: peak.time, azimuth: peak.azimuth, altitude: peak.altitude, magnitude: peak.magnitude };
  });

  const constellationPeaks = new Map<string, Peak>();
  for (const time of times) {
    for (const { slug, azimuth, altitude } of getConstellationSkyPositions(latitude, longitude, time)) {
      const current = constellationPeaks.get(slug);
      if (!current || altitude > current.altitude) constellationPeaks.set(slug, { time, azimuth, altitude });
    }
  }
  const constellations = [...constellationPeaks]
    .map(([slug, peak]): ConstellationTarget => ({ kind: 'constellation', slug, ...peak }))
    .filter((target) => target.altitude >= MIN_ALTITUDE)
    .sort((a, b) => b.altitude - a.altitude)
    .slice(0, MAX_CONSTELLATIONS);

  const visible = bodies.filter((target) => target.altitude >= MIN_ALTITUDE);
  const planets = visible.filter((target) => target.key !== 'moon').sort((a, b) => a.magnitude - b.magnitude);
  const moon = visible.filter((target) => target.key === 'moon');
  return [...planets, ...moon, ...constellations];
}
