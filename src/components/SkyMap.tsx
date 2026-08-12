import { useMemo, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Circle, G, Svg, Text as SvgText } from 'react-native-svg';
import { Paragraph, XStack, YStack } from 'tamagui';

import { azimuthToCompass } from '@/lib/astronomy';
import { projectToView, type FieldOfView, type ViewDirection } from '@/lib/skyProjection';
import { palette } from '@/theme/palette';

export type SkyMapObject = {
  id: string;
  azimuth: number;
  altitude: number;
  label: string;
  color: string;
  radius: number;
};

const MAP_SIZE = 340;
const DEFAULT_VIEW: ViewDirection = { azimuth: 180, altitude: 30 };
const DEG_PER_PIXEL = 0.3;
const DEFAULT_FOV_DEG = 80;
const MIN_FOV_DEG = 30;
const MAX_FOV_DEG = 120;
const ZOOM_STEP_DEG = 15;

// "use no memo" -- PanResponder je eksterni imperativni API kojem se
// callback-i predaju direktno; React Compiler ne moze staticki dokazati da
// PanResponder.create ne poziva te callback-e odmah (iako ih samo cuva za
// kasnije), pa odbija refs unutar njih. Ovdje je ref-baziran pristup
// stvarno ispravan i neophodan -- stabilna PanResponder instanca kroz
// re-rendere je bitna za glatko prevlacenje (nestabilna instanca svaki
// render prekida gest usred pokreta).
export function SkyMap({ objects }: { objects: SkyMapObject[] }) {
  'use no memo';

  const { t } = useTranslation();
  const [view, setView] = useState<ViewDirection>(DEFAULT_VIEW);
  const [fovDeg, setFovDeg] = useState(DEFAULT_FOV_DEG);

  const viewRef = useRef(view);
  // eslint-disable-next-line react-hooks/refs -- vidi napomenu iznad funkcije
  viewRef.current = view;
  const dragStartRef = useRef(view);

  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- vidi napomenu iznad funkcije
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = viewRef.current;
        },
        onPanResponderMove: (_evt, gesture) => {
          const nextAzimuth = (dragStartRef.current.azimuth - gesture.dx * DEG_PER_PIXEL + 360) % 360;
          const nextAltitude = Math.max(-10, Math.min(85, dragStartRef.current.altitude + gesture.dy * DEG_PER_PIXEL));
          setView({ azimuth: nextAzimuth, altitude: nextAltitude });
        },
      }),
    [],
  );

  const fov: FieldOfView = { horizontalDeg: fovDeg, verticalDeg: fovDeg };
  const half = MAP_SIZE / 2;

  function zoom(deltaDeg: number) {
    setFovDeg((prev) => Math.max(MIN_FOV_DEG, Math.min(MAX_FOV_DEG, prev + deltaDeg)));
  }

  return (
    <YStack gap="$2">
      <YStack
        {...panResponder.panHandlers}
        width={MAP_SIZE}
        height={MAP_SIZE}
        borderRadius="$6"
        overflow="hidden"
        backgroundColor={palette.void}
        borderWidth={1}
        borderColor={palette.nebulaDeep}>
        <Svg width={MAP_SIZE} height={MAP_SIZE}>
          {objects.map((obj) => {
            const projected = projectToView(obj.azimuth, obj.altitude, view, fov);
            if (!projected.visible) return null;
            const cx = half + projected.x * half;
            const cy = half + projected.y * half;
            return (
              <G key={obj.id}>
                <Circle cx={cx} cy={cy} r={obj.radius} fill={obj.color} />
                <SvgText x={cx} y={cy + obj.radius + 12} fontSize={11} fill={palette.starlight} textAnchor="middle">
                  {obj.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        <XStack position="absolute" bottom="$2" right="$2" gap="$2">
          <ZoomButton icon="add" onPress={() => zoom(-ZOOM_STEP_DEG)} disabled={fovDeg <= MIN_FOV_DEG} />
          <ZoomButton icon="remove" onPress={() => zoom(ZOOM_STEP_DEG)} disabled={fovDeg >= MAX_FOV_DEG} />
        </XStack>
      </YStack>
      <Paragraph fontSize="$2" color="$color11" textAlign="center">
        {t('tonight.map.compassHint', { direction: azimuthToCompass(view.azimuth) })}
      </Paragraph>
    </YStack>
  );
}

function ZoomButton({
  icon,
  onPress,
  disabled,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <YStack
      width={36}
      height={36}
      borderRadius={999}
      ai="center"
      jc="center"
      backgroundColor="rgba(23,19,52,0.85)"
      borderWidth={1}
      borderColor={palette.nebulaDeep}
      opacity={disabled ? 0.4 : 1}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.7 }}>
      <Ionicons name={icon} size={18} color={palette.starlight} />
    </YStack>
  );
}
