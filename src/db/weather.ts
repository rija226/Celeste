// Oblacnost po satima iz MET Norway Locationforecast 2.0 (besplatno, i komercijalno,
// uz navodjenje izvora). Uslovi: identifikacijski User-Agent, max 4 decimale
// koordinata, bez nepotrebnog ponavljanja zahtjeva.
// https://api.met.no/doc/TermsOfService

const FORECAST_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const USER_AGENT = 'Celeste/1.0 github.com/rija226/Celeste';
const CACHE_MS = 60 * 60 * 1000;

export type CloudHour = { time: Date; cloudCover: number };

type ForecastResponse = {
  properties: {
    timeseries: { time: string; data: { instant: { details: { cloud_area_fraction?: number } } } }[];
  };
};

// ponytail: kes u memoriji (1 h po zaokruzenoj lokaciji); Expires/If-Modified-Since tek kad zahtjevi idu preko servera
const cache = new Map<string, { at: number; hours: CloudHour[] }>();

export async function getCloudForecast(latitude: number, longitude: number): Promise<CloudHour[]> {
  // 2 decimale (~1 km) -- dovoljno za prognozu, bolji kes i manje precizna lokacija u zahtjevu
  const lat = latitude.toFixed(2);
  const lon = longitude.toFixed(2);
  const key = `${lat},${lon}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.hours;

  const res = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`MET Norway ${res.status}`);
  const body = (await res.json()) as ForecastResponse;

  const hours = body.properties.timeseries.flatMap((entry) => {
    const cloudCover = entry.data.instant.details.cloud_area_fraction;
    return cloudCover === undefined ? [] : [{ time: new Date(entry.time), cloudCover }];
  });
  cache.set(key, { at: Date.now(), hours });
  return hours;
}
