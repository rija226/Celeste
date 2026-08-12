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
export function useDeviceHeading(enabled: boolean): DeviceHeading | null {
  const [heading, setHeading] = useState<DeviceHeading | null>(null);
  const azimuthRef = useRef(0);
  const accuracyRef = useRef<number | null>(null);

  useEffect(() => {
    // Potrosac (SkyMap) vec ignorise deviceHeading kad enabled===false, pa
    // nema potrebe eksplicitno resetovati state ovdje (izbjegava setState
    // sinhrono u tijelu efekta).
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    let headingSubscription: { remove: () => void } | null = null;
    let motionSubscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      headingSubscription = await Location.watchHeadingAsync((event) => {
        azimuthRef.current = event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
        accuracyRef.current = event.accuracy;
      });

      DeviceMotion.setUpdateInterval(100);
      motionSubscription = DeviceMotion.addListener((motion) => {
        if (cancelled || !motion.rotation) return;
        const betaDeg = (motion.rotation.beta * 180) / Math.PI;
        const altitude = Math.max(-10, Math.min(85, betaDeg - 90));
        setHeading({ azimuth: azimuthRef.current, altitude, accuracy: accuracyRef.current });
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
