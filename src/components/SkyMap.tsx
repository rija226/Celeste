import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedReaction, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Line, Svg } from 'react-native-svg';
import { Paragraph, YStack } from 'tamagui';

import { azimuthToCompass } from '@/lib/astronomy';
import { useDeviceAttitude, type DeviceAttitudeState } from '@/lib/deviceOrientation';
import { cameraAzimuth, focalLengthPx, horizontalToVector, projectToScreen } from '@/lib/skyProjection';
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

// Okvir AR prikaza kad nije preko cijelog ekrana.
const MAP_HORIZONTAL_PADDING = 16;
const MAP_HEIGHT_RATIO = 0.72;
// Sazvijezdje se crta kao mala ikona centrirana na svoju (priblizno) tacnu
// poziciju -- stars su 0-100 normalizovane koordinate (isti format kao
// kviz), pa se skaliraju na ovu velicinu u px.
const CONSTELLATION_ICON_SIZE = 64;
// Mnozilac radijusa planeta/Mjeseca/Sunca na AR prikazu (radius dolazi iz ekrana).
const OBJECT_MARKER_SCALE = 1.8;
// Sirina kutije oznake (ikona + natpis ispod) -- ikona je horizontalno centrirana u njoj.
const MARKER_WIDTH = 120;
// Vidljivi markeri su cesto premali za pouzdan tap (npr. planeta r=5px).
const MARKER_HIT_SLOP = 12;
// Hintovi na vrhu su centrirani, s mjestom desno za dugme preko cijelog ekrana.
const HINT_SIDE_MARGIN = 52;
// Kalibracija: mnozilac fokalne duzine iz stvarnog FOV-a kamere. Ako se pri
// okretanju telefona oznake pomjeraju BRZE od slike kamere -- smanji; ako
// SPORIJE -- povecaj.
const FOCAL_SCALE = 1.0;

// AR pogled -- kamera kao pozadina, orijentacija telefona odredjuje sta se
// vidi. Korisnik bira okvir unutar ekrana ili prikaz preko cijelog ekrana;
// `children` (npr. panel s detaljima odabranog objekta) ide ispod okvira,
// odnosno preko dna slike u prikazu preko cijelog ekrana.
export function SkyMap({
  objects,
  constellations = [],
  children,
}: {
  objects: SkyMapObject[];
  constellations?: SkyMapConstellation[];
  children?: ReactNode;
}) {
  const attitude = useDeviceAttitude();
  const [fullscreen, setFullscreen] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sky = (
    <SkyView
      objects={objects}
      constellations={constellations}
      attitude={attitude}
      fullscreen={fullscreen}
      onToggleFullscreen={() => setFullscreen((value) => !value)}
      topInset={fullscreen ? insets.top : 0}
    />
  );

  if (fullscreen) {
    return (
      <Modal
        visible
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setFullscreen(false)}>
        <YStack f={1} backgroundColor={palette.void}>
          {sky}
          {children && (
            <YStack position="absolute" left="$4" right="$4" bottom={insets.bottom + 16}>
              {children}
            </YStack>
          )}
        </YStack>
      </Modal>
    );
  }

  return (
    <YStack gap="$3" ai="center" width="100%">
      <YStack
        width={width - MAP_HORIZONTAL_PADDING * 2}
        height={height * MAP_HEIGHT_RATIO}
        borderRadius="$6"
        overflow="hidden"
        borderWidth={1}
        borderColor={palette.nebulaDeep}>
        {sky}
      </YStack>
      {children}
    </YStack>
  );
}

function SkyView({
  objects,
  constellations,
  attitude,
  fullscreen,
  onToggleFullscreen,
  topInset,
}: {
  objects: SkyMapObject[];
  constellations: SkyMapConstellation[];
  attitude: DeviceAttitudeState;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  topInset: number;
}) {
  const { t } = useTranslation();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [compassIndex, setCompassIndex] = useState<number | null>(null);
  const { matrix } = attitude;

  // Hint "Gledas prema ..." se mijenja samo kad se promijeni strana svijeta,
  // ne na svako ocitanje senzora -- inace bi opet bio React re-render po frame-u.
  useAnimatedReaction(
    () => {
      const m = matrix.get();
      return m ? Math.round(cameraAzimuth(m) / 45) % 8 : null;
    },
    (index, previous) => {
      if (index !== previous) scheduleOnRN(setCompassIndex, index);
    },
  );

  const focalPx = focalLengthPx(size.width, size.height, attitude.cameraFov) * FOCAL_SCALE;
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const iconScale = CONSTELLATION_ICON_SIZE / 100;

  return (
    <YStack
      f={1}
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {size.width > 0 &&
        constellations.map((c) => (
          <SkyMarker
            key={c.slug}
            azimuth={c.azimuth}
            altitude={c.altitude}
            matrix={matrix}
            focalPx={focalPx}
            centerX={centerX}
            centerY={centerY}
            anchorY={CONSTELLATION_ICON_SIZE / 2}
            onPress={c.onPress}>
            <Svg width={CONSTELLATION_ICON_SIZE} height={CONSTELLATION_ICON_SIZE}>
              {c.lines.map(([a, b], index) => (
                <Line
                  key={index}
                  x1={c.stars[a].x * iconScale}
                  y1={c.stars[a].y * iconScale}
                  x2={c.stars[b].x * iconScale}
                  y2={c.stars[b].y * iconScale}
                  stroke={palette.haze}
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
              ))}
              {c.stars.map((star, index) => (
                <Circle key={index} cx={star.x * iconScale} cy={star.y * iconScale} r={2.2} fill={palette.starlight} />
              ))}
            </Svg>
            <Paragraph fontSize={12} lineHeight={16} color={palette.haze}>
              {c.name}
            </Paragraph>
          </SkyMarker>
        ))}

      {size.width > 0 &&
        objects.map((obj) => (
          <SkyMarker
            key={obj.id}
            azimuth={obj.azimuth}
            altitude={obj.altitude}
            matrix={matrix}
            focalPx={focalPx}
            centerX={centerX}
            centerY={centerY}
            anchorY={obj.radius * OBJECT_MARKER_SCALE}
            onPress={obj.onPress}>
            <YStack
              width={obj.radius * OBJECT_MARKER_SCALE * 2}
              height={obj.radius * OBJECT_MARKER_SCALE * 2}
              borderRadius={999}
              backgroundColor={obj.color}
            />
            <Paragraph fontSize={13} lineHeight={17} color={palette.starlight}>
              {obj.label}
            </Paragraph>
          </SkyMarker>
        ))}

      <YStack
        position="absolute"
        top={topInset + 8}
        left={HINT_SIDE_MARGIN}
        right={HINT_SIDE_MARGIN}
        ai="center"
        gap="$1.5"
        pointerEvents="none">
        {compassIndex !== null && (
          <YStack backgroundColor="rgba(6,7,13,0.75)" borderRadius="$4" py="$1.5" px="$3">
            <Paragraph fontSize="$1" color={palette.starlight} textAlign="center">
              {t('tonight.map.sensorHint', { direction: azimuthToCompass(compassIndex * 45) })}
            </Paragraph>
          </YStack>
        )}
        {attitude.available === false && (
          <YStack backgroundColor="rgba(6,7,13,0.75)" borderRadius="$4" py="$1.5" px="$3">
            <Paragraph fontSize="$1" color={palette.starlight} textAlign="center">
              {t('tonight.map.sensorUnavailable')}
            </Paragraph>
          </YStack>
        )}
        {attitude.poorCalibration && (
          <YStack ai="center" backgroundColor="rgba(255,107,94,0.85)" borderRadius="$4" py="$1.5" px="$2">
            <Paragraph fontSize="$1" color={palette.void} fontWeight="600" textAlign="center">
              {t('tonight.map.calibrationHint')}
            </Paragraph>
          </YStack>
        )}
      </YStack>

      <YStack position="absolute" top={topInset + 8} right={8}>
        <MapButton icon={fullscreen ? 'contract' : 'expand'} onPress={onToggleFullscreen} />
      </YStack>
    </YStack>
  );
}

// Oznaka koja prati svoju tacku neba. Pozicija se racuna na UI threadu iz
// shared value orijentacije -- React se ne re-renderuje dok se telefon pomjera,
// pa sadrzaj (SVG ikona, natpis) ostaje nepromijenjen a pomjera se samo kutija.
function SkyMarker({
  azimuth,
  altitude,
  matrix,
  focalPx,
  centerX,
  centerY,
  anchorY,
  onPress,
  children,
}: {
  azimuth: number;
  altitude: number;
  matrix: SharedValue<number[] | null>;
  focalPx: number;
  centerX: number;
  centerY: number;
  // Udaljenost od vrha kutije do tacke koja treba lezati na poziciji objekta (centar ikone).
  anchorY: number;
  onPress?: () => void;
  children: ReactNode;
}) {
  const vector = horizontalToVector(azimuth, altitude);

  const animatedStyle = useAnimatedStyle(() => {
    const m = matrix.get();
    const point = m ? projectToScreen(vector, m, focalPx) : null;
    if (!point || !point.visible) {
      // Iza kamere -- daleko van prikaza, da ne hvata dodire.
      return { transform: [{ translateX: -10000 }, { translateY: 0 }] };
    }
    return {
      transform: [{ translateX: centerX + point.x - MARKER_WIDTH / 2 }, { translateY: centerY + point.y - anchorY }],
    };
  });

  return (
    <Animated.View style={[styles.marker, animatedStyle]} pointerEvents="box-none">
      <Pressable onPress={onPress} hitSlop={MARKER_HIT_SLOP} style={styles.markerContent}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function MapButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
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
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}>
      <Ionicons name={icon} size={18} color={palette.starlight} />
    </YStack>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MARKER_WIDTH,
    alignItems: 'center',
  },
  markerContent: {
    alignItems: 'center',
  },
});
