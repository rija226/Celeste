import { useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Circle, G, Line, Svg, Text as SvgText } from 'react-native-svg';
import { Paragraph, XStack, YStack } from 'tamagui';

import { azimuthToCompass } from '@/lib/astronomy';
import { useDeviceHeading } from '@/lib/deviceOrientation';
import { projectToView, type FieldOfView, type ViewDirection } from '@/lib/skyProjection';
import { palette } from '@/theme/palette';
import type { ConstellationLine, ConstellationStar } from '@/types/models';

export type SkyMapObject = {
  id: string;
  azimuth: number;
  altitude: number;
  label: string;
  color: string;
  radius: number;
  onPress?: () => void;
};

export type SkyMapConstellation = {
  slug: string;
  azimuth: number;
  altitude: number;
  name: string;
  stars: ConstellationStar[];
  lines: ConstellationLine[];
  onPress?: () => void;
};

// Vidljivi markeri su cesto premali za pouzdan tap (npr. planeta r=5px) --
// nevidljiv veci krug preko njih daje ugodniji touch target bez mijenjanja
// izgleda.
const TOUCH_TARGET_RADIUS = 18;

// Mapa i AR oboje djeluju uronjeno (skoro cio ekran) -- ista velicina za obje.
const MAP_HORIZONTAL_PADDING = 16;
const MAP_HEIGHT_RATIO = 0.72;
// Sazvijezdje se crta kao mala ikona centrirana na svoju (priblizno) tacnu
// poziciju -- stars su 0-100 normalizovane koordinate (isti format kao
// kviz), pa se skaliraju oko svog sredista (50,50) na ovu velicinu u px.
const CONSTELLATION_ICON_SIZE = 34;
const DEFAULT_VIEW: ViewDirection = { azimuth: 180, altitude: 30 };
const DEG_PER_PIXEL = 0.3;
const DEFAULT_FOV_DEG = 80;
const MIN_FOV_DEG = 30;
const MAX_FOV_DEG = 120;
const ZOOM_STEP_DEG = 15;
// Kompas tacnost (stepeni moguce greske, iOS konvencija -- manje = bolje;
// prvi pokusaj praga, ocekivano fino podesavanje nakon testiranja).
const POOR_ACCURACY_THRESHOLD_DEG = 20;

// "use no memo" -- PanResponder je eksterni imperativni API kojem se
// callback-i predaju direktno; React Compiler ne moze staticki dokazati da
// PanResponder.create ne poziva te callback-e odmah (iako ih samo cuva za
// kasnije), pa odbija refs unutar njih. Ovdje je ref-baziran pristup
// stvarno ispravan i neophodan -- stabilna PanResponder instanca kroz
// re-rendere je bitna za glatko prevlacenje (nestabilna instanca svaki
// render prekida gest usred pokreta).
export function SkyMap({
  objects,
  constellations = [],
  arMode = false,
}: {
  objects: SkyMapObject[];
  constellations?: SkyMapConstellation[];
  // AR pogled -- kamera kao pozadina, senzori su jedini nacin gledanja
  // (rucno prevlacenje nema smisla kad stvarno gledas kroz kameru).
  arMode?: boolean;
}) {
  'use no memo';

  const { t } = useTranslation();
  const [view, setView] = useState<ViewDirection>(DEFAULT_VIEW);
  const [fovDeg, setFovDeg] = useState(DEFAULT_FOV_DEG);
  const [manualSensorMode, setManualSensorMode] = useState(false);
  const sensorMode = arMode || manualSensorMode;
  const deviceHeading = useDeviceHeading(sensorMode);
  const effectiveView = sensorMode && deviceHeading ? { azimuth: deviceHeading.azimuth, altitude: deviceHeading.altitude } : view;

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

  const mapWidth = Dimensions.get('window').width - MAP_HORIZONTAL_PADDING * 2;
  const mapHeight = Dimensions.get('window').height * MAP_HEIGHT_RATIO;
  // Vertikalni FOV se skalira proporcionalno sirini/visini da markeri ne
  // izgledaju rastegnuti kad prikaz nije kvadratan (visok pravougaonik).
  const fov: FieldOfView = { horizontalDeg: fovDeg, verticalDeg: fovDeg * (mapHeight / mapWidth) };
  const halfW = mapWidth / 2;
  const halfH = mapHeight / 2;

  function zoom(deltaDeg: number) {
    setFovDeg((prev) => Math.max(MIN_FOV_DEG, Math.min(MAX_FOV_DEG, prev + deltaDeg)));
  }

  return (
    <YStack gap="$2">
      <YStack
        {...(!sensorMode ? panResponder.panHandlers : {})}
        width={mapWidth}
        height={mapHeight}
        borderRadius="$6"
        overflow="hidden"
        backgroundColor={arMode ? 'transparent' : palette.void}
        borderWidth={1}
        borderColor={palette.nebulaDeep}>
        {arMode && <CameraView style={StyleSheet.absoluteFill} facing="back" />}
        <Svg width={mapWidth} height={mapHeight} style={arMode ? StyleSheet.absoluteFill : undefined}>
          {constellations.map((c) => {
            const projected = projectToView(c.azimuth, c.altitude, effectiveView, fov);
            if (!projected.visible) return null;
            const cx = halfW + projected.x * halfW;
            const cy = halfH + projected.y * halfH;
            const scale = CONSTELLATION_ICON_SIZE / 100;
            const starX = (star: ConstellationStar) => cx + (star.x - 50) * scale;
            const starY = (star: ConstellationStar) => cy + (star.y - 50) * scale;
            return (
              <G key={c.slug} onPress={c.onPress}>
                {c.lines.map(([a, b], index) => (
                  <Line
                    key={index}
                    x1={starX(c.stars[a])}
                    y1={starY(c.stars[a])}
                    x2={starX(c.stars[b])}
                    y2={starY(c.stars[b])}
                    stroke={palette.haze}
                    strokeWidth={1}
                    strokeOpacity={0.8}
                  />
                ))}
                {c.stars.map((star, index) => (
                  <Circle key={index} cx={starX(star)} cy={starY(star)} r={1.4} fill={palette.starlight} />
                ))}
                <SvgText
                  x={cx}
                  y={cy + CONSTELLATION_ICON_SIZE / 2 + 12}
                  fontSize={10}
                  fill={palette.haze}
                  textAnchor="middle">
                  {c.name}
                </SvgText>
                <Circle cx={cx} cy={cy} r={TOUCH_TARGET_RADIUS} fill="transparent" />
              </G>
            );
          })}
          {objects.map((obj) => {
            const projected = projectToView(obj.azimuth, obj.altitude, effectiveView, fov);
            if (!projected.visible) return null;
            const cx = halfW + projected.x * halfW;
            const cy = halfH + projected.y * halfH;
            return (
              <G key={obj.id} onPress={obj.onPress}>
                <Circle cx={cx} cy={cy} r={obj.radius} fill={obj.color} />
                <SvgText x={cx} y={cy + obj.radius + 12} fontSize={11} fill={palette.starlight} textAnchor="middle">
                  {obj.label}
                </SvgText>
                <Circle cx={cx} cy={cy} r={TOUCH_TARGET_RADIUS} fill="transparent" />
              </G>
            );
          })}
        </Svg>

        <YStack position="absolute" top="$2" left="$2" right="$2" ai="center" gap="$1.5">
          <YStack backgroundColor="rgba(6,7,13,0.75)" borderRadius="$4" py="$1.5" px="$3">
            <Paragraph fontSize="$1" color={palette.starlight} textAlign="center">
              {sensorMode
                ? t('tonight.map.sensorHint', { direction: azimuthToCompass(effectiveView.azimuth) })
                : t('tonight.map.compassHint', { direction: azimuthToCompass(effectiveView.azimuth) })}
            </Paragraph>
          </YStack>
          {sensorMode && deviceHeading && deviceHeading.accuracy !== null && deviceHeading.accuracy > POOR_ACCURACY_THRESHOLD_DEG && (
            <YStack ai="center" backgroundColor="rgba(255,107,94,0.85)" borderRadius="$4" py="$1.5" px="$2">
              <Paragraph fontSize="$1" color={palette.void} fontWeight="600" textAlign="center">
                {t('tonight.map.calibrationHint')}
              </Paragraph>
            </YStack>
          )}
        </YStack>

        {!arMode && (
          <XStack position="absolute" bottom="$2" left="$2">
            <MapButton
              icon={sensorMode ? 'phone-portrait' : 'hand-left'}
              onPress={() => setManualSensorMode((v) => !v)}
              disabled={false}
              active={sensorMode}
            />
          </XStack>
        )}

        <XStack position="absolute" bottom="$2" right="$2" gap="$2">
          <MapButton icon="add" onPress={() => zoom(-ZOOM_STEP_DEG)} disabled={fovDeg <= MIN_FOV_DEG} />
          <MapButton icon="remove" onPress={() => zoom(ZOOM_STEP_DEG)} disabled={fovDeg >= MAX_FOV_DEG} />
        </XStack>
      </YStack>
    </YStack>
  );
}

function MapButton({
  icon,
  onPress,
  disabled,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
  active?: boolean;
}) {
  return (
    <YStack
      width={36}
      height={36}
      borderRadius={999}
      ai="center"
      jc="center"
      backgroundColor={active ? palette.nebula : 'rgba(23,19,52,0.85)'}
      borderWidth={1}
      borderColor={active ? palette.nebula : palette.nebulaDeep}
      opacity={disabled ? 0.4 : 1}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.7 }}>
      <Ionicons name={icon} size={18} color={palette.starlight} />
    </YStack>
  );
}
