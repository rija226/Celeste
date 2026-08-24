import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';

import DeviceAttitude from '../../modules/device-attitude';

export type DeviceHeading = {
  azimuth: number;
  altitude: number;
  accuracy: number | null;
};

// Primarni put: native DeviceAttitude modul (vidi /modules/device-attitude)
// cita OS-nivo fuzionisan attitude (CMDeviceMotion na iOS, TYPE_ROTATION_VECTOR
// na Androidu -- zirokop+akcelerometar+kompas fuzionisani zajedno, isti
// pristup koji koriste AR aplikacije za nebo poput Star Walk). To daje
// azimut+visinu iz JEDNE geometrijski konzistentne (roll-kompenzovane)
// orijentacije, umjesto da se azimut i visina racunaju odvojeno.
//
// Fallback (JS-only EMA + mrtva zona nad sirovim DeviceMotion/kompas
// ocitanjima) ostaje za uredjaje bez fuzionisanog rotation-vector senzora ili
// web, gdje native modul nije dostupan.
const AZIMUTH_SMOOTHING = 0.15;
const ALTITUDE_SMOOTHING = 0.25;
const AZIMUTH_DEADBAND_DEG = 1.2;
const ALTITUDE_DEADBAND_DEG = 0.8;
const ATTITUDE_UPDATE_INTERVAL_MS = 33; // ~30Hz

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
    accuracyRef.current = null;

    let headingSubscription: { remove: () => void } | null = null;
    let attitudeSubscription: { remove: () => void } | null = null;
    let motionSubscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const nativeAvailable = await DeviceAttitude.isAvailableAsync().catch(() => false);

      // Kompas API (expo-location) ostaje u oba slucaja pretplacen -- kad je
      // native attitude dostupan, koristi se samo za headingAccuracy (banner
      // "loša kalibracija" u SkyMap-u); kad nije, nosi i sam azimut (fallback).
      headingSubscription = await Location.watchHeadingAsync((event) => {
        if (cancelled) return;
        accuracyRef.current = event.accuracy;
        if (nativeAvailable) return;

        const raw = event.trueHeading >= 0 ? event.trueHeading : event.magHeading;
        if (smoothedAzimuthRef.current === null) {
          smoothedAzimuthRef.current = raw;
        } else {
          // Najkraci ugaoni put -- sprijecava da EMA "obleti" dugi put kruga
          // kad ocitanje predje granicu 0/360 (npr. 359 -> 1).
          const delta = ((raw - smoothedAzimuthRef.current + 540) % 360) - 180;
          if (Math.abs(delta) >= AZIMUTH_DEADBAND_DEG) {
            smoothedAzimuthRef.current = (smoothedAzimuthRef.current + delta * AZIMUTH_SMOOTHING + 360) % 360;
          }
        }
      });

      if (nativeAvailable) {
        await DeviceAttitude.setUpdateInterval(ATTITUDE_UPDATE_INTERVAL_MS);
        attitudeSubscription = DeviceAttitude.addListener('onAttitudeUpdate', (event) => {
          if (cancelled) return;
          setHeading({ azimuth: event.azimuth, altitude: event.altitude, accuracy: accuracyRef.current });
        });
        return;
      }

      DeviceMotion.setUpdateInterval(100);
      motionSubscription = DeviceMotion.addListener((motion) => {
        if (cancelled || !motion.rotation) return;
        const betaDeg = (motion.rotation.beta * 180) / Math.PI;
        const rawAltitude = Math.max(-10, Math.min(85, betaDeg - 90));
        if (smoothedAltitudeRef.current === null) {
          smoothedAltitudeRef.current = rawAltitude;
        } else if (Math.abs(rawAltitude - smoothedAltitudeRef.current) >= ALTITUDE_DEADBAND_DEG) {
          smoothedAltitudeRef.current += (rawAltitude - smoothedAltitudeRef.current) * ALTITUDE_SMOOTHING;
        }
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
      attitudeSubscription?.remove();
      motionSubscription?.remove();
    };
  }, [enabled]);

  return heading;
}
