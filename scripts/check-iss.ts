// Provjera preleta ISS-a. Pokretanje:
//   npx esbuild scripts/check-iss.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';

import { findIssPasses, isSunlit } from '../src/lib/iss';
import { getSunPosition } from '../src/lib/astronomy';

// Sjena: Sunce je na +x; stanica iza Zemlje (-x, blizu osi) je u sjeni, sa strane ili ispred nije.
const sun = { x: 1, y: 0, z: 0 };
assert.equal(isSunlit({ x: -6800, y: 0, z: 0 }, sun), false);
assert.equal(isSunlit({ x: -6800, y: 6500, z: 0 }, sun), true);
assert.equal(isSunlit({ x: 6800, y: 0, z: 0 }, sun), true);

// Stvarni TLE (epoha 28.10.2026.) -- preleti 3 dana od epohe nad Zagrebom.
const tle = {
  line1: '1 25544U 98067A   26301.59601386  .00005724  00000+0  11161-3 0  9990',
  line2: '2 25544  51.6336 359.9178 0006994 320.4528  39.5949 15.49090321592436',
};
const ZG = [45.81, 15.98] as const;
const DAY = 24 * 60 * 60 * 1000;
const epoch = Date.parse('2026-10-28T14:00:00Z');
const passes = [0, 1, 2].flatMap((d) => findIssPasses(tle, ...ZG, new Date(epoch + d * DAY)));

for (const p of passes) {
  const minutes = (p.end.getTime() - p.start.getTime()) / 60000;
  assert.ok(p.start <= p.peak && p.peak <= p.end, 'start <= vrhunac <= kraj');
  assert.ok(minutes < 12, `prelet traje ${minutes} min`);
  assert.ok(p.maxElevation >= 10 && p.maxElevation <= 90);
  assert.ok(getSunPosition(...ZG, p.peak).altitude <= -6, 'na vrhuncu je nebo tamno');
}

console.log('check-iss: OK');
for (const p of passes) {
  console.log(
    `${p.start.toISOString().slice(5, 16)}Z ${Math.round(p.startAzimuth)}° -> ${Math.round(p.endAzimuth)}°, max ${Math.round(p.maxElevation)}°, ${Math.round((p.end.getTime() - p.start.getTime()) / 60000)} min`,
  );
}
