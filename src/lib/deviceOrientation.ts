import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import DeviceAttitude, { type CameraFov } from '../../modules/device-attitude';
import { createAttitudeFilter } from './skyProjection';

const ATTITUDE_UPDATE_INTERVAL_MS = 16; // ~60Hz
// Tipicna glavna kamera telefona u portretu -- dok (ili ako) native ne vrati pravi FOV.
const FALLBACK_CAMERA_FOV: CameraFov = { horizontalDeg: 50, verticalDeg: 65 };
// iOS: moguca greska kompasa u stepenima (manje = bolje).
const POOR_ACCURACY_THRESHOLD_DEG = 20;

export type DeviceAttitudeState = {
  // Filtrirana device->world matrica (vidi DeviceAttitudeEvent), null dok ne
  // stigne prvo ocitanje. Shared value -- AR prikaz je cita direktno na UI
  // threadu, pa nema React re-rendera po ocitanju senzora.
  matrix: SharedValue<number[] | null>;
  // null dok se jos provjerava.
  available: boolean | null;
  poorCalibration: boolean;
  cameraFov: CameraFov;
};

// expo-location daje razlicitu skalu tacnosti po platformi: Android 0-3
// (nivo kalibracije, 3 = najbolje), iOS greska u stepenima (negativno = nevazece).
function isPoorAccuracy(accuracy: number): boolean {
  if (Platform.OS === 'android') return accuracy < 2;
  return accuracy < 0 || accuracy > POOR_ACCURACY_THRESHOLD_DEG;
}

// Orijentacija dolazi iz native DeviceAttitude modula (vidi
// /modules/device-attitude) -- OS-nivo fuzija zirokopa, akcelerometra i
// kompasa. Uredjaj bez toga (ili web) nema AR prikaz.
export function useDeviceAttitude(): DeviceAttitudeState {
  const matrix = useSharedValue<number[] | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [poorCalibration, setPoorCalibration] = useState(false);
  const [cameraFov, setCameraFov] = useState(FALLBACK_CAMERA_FOV);

  useEffect(() => {
    let cancelled = false;
    let attitudeSubscription: { remove: () => void } | null = null;
    let headingSubscription: { remove: () => void } | null = null;
    const filter = createAttitudeFilter();

    (async () => {
      const isAvailable = await DeviceAttitude.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      setAvailable(isAvailable);
      if (!isAvailable) return;

      DeviceAttitude.getCameraFovAsync()
        .then((fov) => {
          if (!cancelled && fov) setCameraFov(fov);
        })
        .catch(() => {});

      await DeviceAttitude.setUpdateInterval(ATTITUDE_UPDATE_INTERVAL_MS);
      if (cancelled) return;
      attitudeSubscription = DeviceAttitude.addListener('onAttitudeUpdate', (event) => {
        matrix.set(filter(event.matrix, event.timestamp));
      });

      // Kompas API (expo-location) samo za banner "loša kalibracija".
      const subscription = await Location.watchHeadingAsync((event) => {
        setPoorCalibration(isPoorAccuracy(event.accuracy));
      });
      if (cancelled) subscription.remove();
      else headingSubscription = subscription;
    })();

    return () => {
      cancelled = true;
      attitudeSubscription?.remove();
      headingSubscription?.remove();
    };
  }, [matrix]);

  return { matrix, available, poorCalibration, cameraFov };
}
