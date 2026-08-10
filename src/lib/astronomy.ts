import { Body, Equator, Horizon, Illumination, Observer, SearchRiseSet } from 'astronomy-engine';

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
  bodies: SkyBodyInfo[];
};

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
    bodies: SKY_BODY_KEYS.map((key) => computeBodyInfo(key, observer, date)),
  };
}
