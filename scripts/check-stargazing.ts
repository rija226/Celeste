// Provjera ocjene za veceras. Pokretanje:
//   npx esbuild scripts/check-stargazing.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';

import {
  getDarkWindow,
  getRatingLevel,
  getViewingTargets,
  planTonight,
  rateNight,
  type NightHour,
} from '../src/lib/stargazing';

const HOUR = 60 * 60 * 1000;
const dark = { start: new Date('2026-10-28T17:30:00Z'), end: new Date('2026-10-29T03:30:00Z') };
const night = (clouds: number[], moonAltitude = -10): NightHour[] =>
  clouds.map((cloudCover, i) => ({ time: new Date(dark.start.getTime() - HOUR / 2 + i * HOUR), cloudCover, moonAltitude }));

// Vedro, bez Mjeseca: 100 i termin je cijeli mrak.
const clear = rateNight(night(Array(11).fill(0)), 0.5, dark)!;
assert.equal(clear.score, 100);
assert.deepEqual(clear.best, dark);

// Oblacno osim dva sata: termin su ta dva sata.
const gap = rateNight(night([100, 100, 90, 0, 5, 100, 100]), 0, dark)!;
assert.equal(gap.score, 98);
assert.equal(gap.best.start.getTime(), dark.start.getTime() + 2.5 * HOUR);
assert.equal(gap.best.end.getTime(), dark.start.getTime() + 4.5 * HOUR);
assert.equal(gap.cloudCover, 3);

// Pun Mjesec iznad obzora: vedra noc pada na 40.
assert.equal(rateNight(night([0, 0], 30), 1, dark)!.score, 40);
assert.equal(rateNight([], 0, dark), null);

assert.equal(getRatingLevel(80), 'excellent');
assert.equal(getRatingLevel(50), 'good');
assert.equal(getRatingLevel(24), 'poor');

// Zagreb: mrak postoji i ljeti i zimi, trajanje ima smisla, a usred noci je "veceras" ova noc.
const ZG = [45.81, 15.98] as const;
for (const [date, minH, maxH] of [['2026-06-21T12:00:00Z', 2, 4], ['2026-12-21T12:00:00Z', 10, 13]] as const) {
  const w = getDarkWindow(...ZG, new Date(date))!;
  const hours = (w.end.getTime() - w.start.getTime()) / HOUR;
  assert.ok(hours > minH && hours < maxH, `${date}: mrak traje ${hours.toFixed(1)} h`);
}
const midnight = new Date('2026-10-28T23:00:00Z');
const w = getDarkWindow(...ZG, midnight)!;
assert.ok(w.start < midnight && midnight < w.end, 'usred noci prozor sadrzi sadasnji trenutak');

// Kroz planTonight: sati van mraka i prije sada se ne broje.
const forecast = Array.from({ length: 48 }, (_, i) => ({
  time: new Date(Date.parse('2026-10-28T12:00:00Z') + i * HOUR),
  cloudCover: 0,
}));
const plan = planTonight(...ZG, forecast, 0, midnight)!;
assert.ok(plan.rating!.best.start >= midnight && plan.rating!.best.end <= plan.dark.end);
assert.equal(planTonight(...ZG, [], 0, midnight)!.rating, null);

// Sta gledati: sve dovoljno visoko i u terminu; planete po sjaju, pa Mjesec, pa najvisa sazvijezdja (max 4).
const evening = { start: new Date('2026-10-28T19:00:00Z'), end: new Date('2026-10-28T22:00:00Z') };
const targets = getViewingTargets(...ZG, evening);
const kindOrder = (t: (typeof targets)[number]) => (t.kind === 'constellation' ? 2 : t.key === 'moon' ? 1 : 0);
assert.ok(targets.some((t) => t.kind === 'constellation'), 'u listopadu navecer ima sazvijezdja iznad obzora');
assert.ok(targets.filter((t) => t.kind === 'constellation').length <= 4);
targets.forEach((t, i) => {
  assert.ok(t.altitude >= 15 && t.time >= evening.start && t.time <= evening.end, `${JSON.stringify(t)}`);
  const prev = targets[i - 1];
  if (!prev) return;
  assert.ok(kindOrder(prev) <= kindOrder(t), 'redoslijed planete -> Mjesec -> sazvijezdja');
  if (prev.kind === 'body' && t.kind === 'body' && kindOrder(t) === 0) assert.ok(prev.magnitude <= t.magnitude);
  if (prev.kind === 'constellation' && t.kind === 'constellation') assert.ok(prev.altitude >= t.altitude);
});
assert.deepEqual(getViewingTargets(...ZG, { start: evening.end, end: evening.start }), []);

console.log('check-stargazing: OK');
console.log(targets.map((t) => `${t.kind === 'body' ? t.key : t.slug} ${t.time.toISOString().slice(11, 16)} ${Math.round(t.altitude)}°`).join(', '));
