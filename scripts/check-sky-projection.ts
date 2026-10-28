// Provjera AR matematike (projekcija + filtar). Pokretanje:
//   npx esbuild scripts/check-sky-projection.ts --bundle --platform=node --log-level=warning | node
import assert from 'node:assert/strict';

import { cameraAzimuth, createAttitudeFilter, horizontalToVector, projectToScreen } from '../src/lib/skyProjection';

const near = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} != ${expected}`);

// Telefon uspravno u portretu, kamera gleda na sjever: device X=istok, Y=gore, Z=jug.
// Kolone device->world matrice su ose uredjaja u world (istok, sjever, gore) okviru.
const facingNorth = [1, 0, 0, 0, 0, -1, 0, 1, 0];
const focal = 1000;

const north = projectToScreen(horizontalToVector(0, 0), facingNorth, focal);
assert.ok(north.visible);
near(north.x, 0, 'sjever na horizontu -> centar x');
near(north.y, 0, 'sjever na horizontu -> centar y');

const slightlyEast = projectToScreen(horizontalToVector(10, 0), facingNorth, focal);
near(slightlyEast.x, focal * Math.tan((10 * Math.PI) / 180), 'istocnije -> desno');
near(slightlyEast.y, 0, 'istocnije -> ista visina');

const higher = projectToScreen(horizontalToVector(0, 10), facingNorth, focal);
near(higher.y, -focal * Math.tan((10 * Math.PI) / 180), 'vise -> gore na ekranu');

assert.equal(projectToScreen(horizontalToVector(180, 0), facingNorth, focal).visible, false, 'jug je iza kamere');
near(cameraAzimuth(facingNorth), 0, 'kamera gleda na sjever');

// Isti telefon nagnut 90° udesno (roll): vrh ekrana sad pokazuje istok.
// device X=dolje, Y=istok, Z=jug -> sjever ostaje u centru, objekt iznad horizonta ide ULIJEVO.
const rolledRight = [0, 1, 0, 0, 0, -1, -1, 0, 0];
const higherRolled = projectToScreen(horizontalToVector(0, 10), rolledRight, focal);
near(higherRolled.x, -focal * Math.tan((10 * Math.PI) / 180), 'roll: visina se preslikava na x');
near(higherRolled.y, 0, 'roll: y ostaje u centru');

// Filtar: miran ulaz ostaje nepromijenjen, skok se prigusuje (ali ide prema cilju).
const filter = createAttitudeFilter();
filter(facingNorth, 0);
const steady = filter(facingNorth, 1 / 60);
steady.forEach((value, i) => near(value, facingNorth[i], `filtar miran [${i}]`));
const jumped = filter(rolledRight, 2 / 60);
assert.ok(jumped[0] < 1 && jumped[0] > 0, 'filtar prigusuje nagli skok');

console.log('sky projection OK');
