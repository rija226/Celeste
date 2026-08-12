import { Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchRiseSet } from 'astronomy-engine';

export type SkyBodyKey = 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';

export const SKY_BODY_KEYS: SkyBodyKey[] = ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

const BODY_BY_KEY: Record<SkyBodyKey, Body> = {
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
};

export type SkyBodyInfo = {
  key: SkyBodyKey;
  isUp: boolean;
  altitude: number;
  azimuth: number;
  magnitude: number;
  riseTime: Date | null;
  setTime: Date | null;
};

export type TonightSky = {
  sunrise: Date | null;
  sunset: Date | null;
  moonPhaseFraction: number;
  moonPhaseAngle: number;
  bodies: SkyBodyInfo[];
};

export type MoonPhaseName =
  | 'newMoon'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'fullMoon'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

// MoonPhase() vraca 0-360 (razlika eklipticke duzine Mjesec-Sunce), 8 jednakih
// isjecaka od 45 stepeni, centriranih na svaku od 4 glavne mijene.
export function getMoonPhaseName(angle: number): MoonPhaseName {
  const names: MoonPhaseName[] = [
    'newMoon',
    'waxingCrescent',
    'firstQuarter',
    'waxingGibbous',
    'fullMoon',
    'waningGibbous',
    'lastQuarter',
    'waningCrescent',
  ];
  const index = Math.round(angle / 45) % 8;
  return names[index];
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function azimuthToCompass(azimuth: number): (typeof COMPASS_POINTS)[number] {
  const index = Math.round(azimuth / 45) % 8;
  return COMPASS_POINTS[index];
}

function computeBodyInfo(key: SkyBodyKey, observer: Observer, date: Date): SkyBodyInfo {
  const body = BODY_BY_KEY[key];
  const equator = Equator(body, date, observer, true, true);
  const horizontal = Horizon(date, observer, equator.ra, equator.dec, 'normal');
  const illumination = Illumination(body, date);

  return {
    key,
    isUp: horizontal.altitude > 0,
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    magnitude: illumination.mag,
    riseTime: SearchRiseSet(body, observer, +1, date, 1)?.date ?? null,
    setTime: SearchRiseSet(body, observer, -1, date, 1)?.date ?? null,
  };
}

// stars-above-horizon snimak za dato mjesto/trenutak -- "veceras" ekran
// (Faza 3 Checkpoint 2) ovo samo prikazuje, sva astronomija je ovdje.
export function getTonightSky(latitude: number, longitude: number, date: Date = new Date()): TonightSky {
  const observer = new Observer(latitude, longitude, 0);

  return {
    sunrise: SearchRiseSet(Body.Sun, observer, +1, date, 1)?.date ?? null,
    sunset: SearchRiseSet(Body.Sun, observer, -1, date, 1)?.date ?? null,
    moonPhaseFraction: Illumination(Body.Moon, date).phase_fraction,
    moonPhaseAngle: MoonPhase(date),
    bodies: SKY_BODY_KEYS.map((key) => computeBodyInfo(key, observer, date)),
  };
}

export type HorizontalPosition = { azimuth: number; altitude: number; isUp: boolean };

// Sunceva pozicija na nebu -- getTonightSky namjerno ne racuna ovo (samo
// izlazak/zalazak), za mapu neba (Faza A) treba i azimut/visina.
export function getSunPosition(latitude: number, longitude: number, date: Date = new Date()): HorizontalPosition {
  const observer = new Observer(latitude, longitude, 0);
  const equator = Equator(Body.Sun, date, observer, true, true);
  const horizontal = Horizon(date, observer, equator.ra, equator.dec, 'normal');
  return { azimuth: horizontal.azimuth, altitude: horizontal.altitude, isUp: horizontal.altitude > 0 };
}

export type ConstellationSkyPosition = HorizontalPosition & { slug: string };

// Priblizne (ne precizne IAU) koordinate centra svakog sazvijezdja iz opste
// astronomske literature -- dovoljno tacno da se sazvijezdje pozicionira na
// mapi neba u pravom opstem pravcu/visini. Za milimetarski precizno
// poravnanje (bitno tek za Fazu C -- AR preko kamere) trebao bi pravi
// katalog zvijezda po sazvijezdju, ne samo priblizan centar.
const CONSTELLATION_CENTER_RADEC: Record<string, { raHours: number; decDeg: number }> = {
  'ursa-major': { raHours: 11.0, decDeg: 50 },
  orion: { raHours: 5.58, decDeg: -2 },
  cassiopeia: { raHours: 1.0, decDeg: 60 },
  'ursa-minor': { raHours: 15.0, decDeg: 75 },
  scorpius: { raHours: 16.83, decDeg: -30 },
  leo: { raHours: 10.5, decDeg: 15 },
  cygnus: { raHours: 20.5, decDeg: 45 },
  taurus: { raHours: 4.5, decDeg: 15 },
  gemini: { raHours: 7.0, decDeg: 22 },
  sagittarius: { raHours: 19.0, decDeg: -25 },
  lyra: { raHours: 18.75, decDeg: 37 },
  aquila: { raHours: 19.67, decDeg: 3 },
  'canis-major': { raHours: 6.83, decDeg: -22 },
  andromeda: { raHours: 1.0, decDeg: 38 },
};

export function getConstellationSkyPositions(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): ConstellationSkyPosition[] {
  const observer = new Observer(latitude, longitude, 0);
  return Object.entries(CONSTELLATION_CENTER_RADEC).map(([slug, { raHours, decDeg }]) => {
    const horizontal = Horizon(date, observer, raHours, decDeg, 'normal');
    return { slug, azimuth: horizontal.azimuth, altitude: horizontal.altitude, isUp: horizontal.altitude > 0 };
  });
}
