import { Body, GeoVector } from 'astronomy-engine';
import { degreesToRadians, ecfToLookAngles, eciToEcf, gstime, propagate, twoline2satrec } from 'satellite.js';

import type { Tle } from '@/db/satellites';

import { getSunPosition } from './astronomy';

// ponytail: fiksni korak (~2900 propagacija za 24 h); bisekcija rubova preleta ako zatreba preciznost ispod 30 s
const STEP_MS = 30 * 1000;
const SEARCH_MS = 24 * 60 * 60 * 1000;
const MIN_ELEVATION = 10;
// ISS se vidi tek kad je nebo dovoljno tamno (kraj gradjanskog sumraka), a sama stanica jos na Suncu.
const MAX_SUN_ALTITUDE = -6;
const EARTH_RADIUS_KM = 6371;
const RAD_TO_DEG = 180 / Math.PI;

type Vec = { x: number; y: number; z: number };

export type IssPass = {
  start: Date;
  end: Date;
  peak: Date;
  maxElevation: number;
  startAzimuth: number;
  endAzimuth: number;
};

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;

// Cilindricna sjena Zemlje: satelit je u sjeni ako je na nocnoj strani i blize osi sjene od radijusa Zemlje.
// `sunDirection` je jedinicni vektor prema Suncu; geocentricni J2000 i TEME se razlikuju za <1°, sto je ovdje nebitno.
export function isSunlit(satelliteKm: Vec, sunDirection: Vec): boolean {
  const along = dot(satelliteKm, sunDirection);
  if (along > 0) return true;
  return dot(satelliteKm, satelliteKm) - along * along > EARTH_RADIUS_KM * EARTH_RADIUS_KM;
}

function sunDirection(date: Date): Vec {
  const v = GeoVector(Body.Sun, date, true);
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

// Vidljivi preleti ISS-a u sljedeca 24 h (korak 30 s): iznad 10°, nebo tamno, stanica osvijetljena.
export function findIssPasses(tle: Tle, latitude: number, longitude: number, from: Date = new Date()): IssPass[] {
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observer = { latitude: degreesToRadians(latitude), longitude: degreesToRadians(longitude), height: 0 };
  const passes: IssPass[] = [];
  let current: IssPass | null = null;

  for (let t = from.getTime(); t <= from.getTime() + SEARCH_MS; t += STEP_MS) {
    const date = new Date(t);
    const state = propagate(satrec, date);
    const look = state && ecfToLookAngles(observer, eciToEcf(state.position, gstime(date)));
    const elevation = look ? look.elevation * RAD_TO_DEG : -90;
    const visible =
      state !== null &&
      elevation >= MIN_ELEVATION &&
      getSunPosition(latitude, longitude, date).altitude <= MAX_SUN_ALTITUDE &&
      isSunlit(state.position, sunDirection(date));

    if (visible && look) {
      const azimuth = look.azimuth * RAD_TO_DEG;
      if (!current) {
        current = { start: date, end: date, peak: date, maxElevation: elevation, startAzimuth: azimuth, endAzimuth: azimuth };
      }
      current.end = date;
      current.endAzimuth = azimuth;
      if (elevation > current.maxElevation) {
        current.maxElevation = elevation;
        current.peak = date;
      }
    } else if (current) {
      passes.push(current);
      current = null;
    }
  }
  if (current) passes.push(current);
  return passes;
}
