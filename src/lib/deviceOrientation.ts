import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';

export type DeviceHeading = {
  azimuth: number;
  altitude: number;
  accuracy: number | null;
};

// Kompas ide preko expo-location (isti paket/dozvola kao za GPS lokaciju u
// Tonight ekranu) -- trueHeading vec odgovara azimutu (0=sjever, mjereno ka
// istoku) koji astronomy-engine koristi, bez konverzije. Nagib/visina ide
// preko DeviceMotion (expo-sensors) -- beta (naginjanje naprijed-nazad) se
// pretvara u altitude preko "beta - 90" formule (0 stepeni beta = telefon
// polozen ravno, 90 stepeni = telefon uspravan/gleda horizont, preko 90 =
// naginjanje unazad/gledanje na gore). Ovo je prvi pokusaj -- razlike medju
// proizvodjacima/OS verzijama su poznat izvor netacnosti, ocekivano je fino
// podesavanje nakon testiranja na stvarnom uredjaju.
// Magnetometar/akcelerometar ocitanja su siroviju prirodno "trepere" i za
// mirno drzan telefon (nekoliko stepeni po ocitanju) -- eksponencijalno
// zaglađivanje (EMA) to filtrira bez primjetnog kasnjenja. Nizi faktor =
// gladje ali sporije prati stvarni pokret; ovi su birani da AR i dalje
// djeluje responzivno pri stvarnom okretanju.
const AZIMUTH_SMOOTHING = 0.15;
const ALTITUDE_SMOOTHING = 0.25;

export function useDeviceHeading(enabled: boolean): DeviceHeading | null {
  const [heading, setHeading] = useState<DeviceHeading | null>(null);
  const smoothedAzimuthRef = useRef<number | null>(null);
  const smoothedAltitudeRef = useRef<number | null>(null);
  const accuracyRef = useRef<number | null>(null);

  useEffect(() => {
    // Potrosac (SkyMap) vec ignorise deviceHeading kad enabled===false, pa
    // nema potrebe eksplicitno resetovati state ovdje (izbjegava setState
    // sinhrono u tijelu efekta).
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    // Reset na pocetku svakog "enabled" ciklusa -- sprijecava da se koristi
    // zastarjela zaglađena vrijednost iz prethodne sesije senzora.
    smoothedAzimuthRef.current = null;
    smoothedAltitudeRef.current = null;

    let headingSubscription: { remove: () => void } | null = null;
    let motionSubscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      headingSubscription = await Location.watchHeadingAsync((event) => {
        const raw = event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
        accuracyRef.current = event.accuracy;
        if (smoothedAzimuthRef.current === null) {
          smoothedAzimuthRef.current = raw;
        } else {
          // Najkraci ugaoni put -- sprijecava da EMA "obleti" dugi put kruga
          // kad ocitanje predje granicu 0/360 (npr. 359 -> 1).
          const delta = ((raw - smoothedAzimuthRef.current + 540) % 360) - 180;
          smoothedAzimuthRef.current = (smoothedAzimuthRef.current + delta * AZIMUTH_SMOOTHING + 360) % 360;
        }
      });

      DeviceMotion.setUpdateInterval(100);
      motionSubscription = DeviceMotion.addListener((motion) => {
        if (cancelled || !motion.rotation) return;
        const betaDeg = (motion.rotation.beta * 180) / Math.PI;
        const rawAltitude = Math.max(-10, Math.min(85, betaDeg - 90));
        smoothedAltitudeRef.current =
          smoothedAltitudeRef.current === null
            ? rawAltitude
            : smoothedAltitudeRef.current + (rawAltitude - smoothedAltitudeRef.current) * ALTITUDE_SMOOTHING;
        setHeading({
          azimuth: smoothedAzimuthRef.current ?? 0,
          altitude: smoothedAltitudeRef.current,
          accuracy: accuracyRef.current,
        });
      });
    })();

    return () => {
      cancelled = true;
      headingSubscription?.remove();
      motionSubscription?.remove();
    };
  }, [enabled]);

  return heading;
}
