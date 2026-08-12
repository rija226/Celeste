import { useState } from 'react';
import { PanResponder } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Circle, G, Svg, Text as SvgText } from 'react-native-svg';
import { Paragraph, YStack } from 'tamagui';

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
const FOV: FieldOfView = { horizontalDeg: 80, verticalDeg: 80 };
const DEFAULT_VIEW: ViewDirection = { azimuth: 180, altitude: 30 };
const DEG_PER_PIXEL = 0.3;

export function SkyMap({ objects }: { objects: SkyMapObject[] }) {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewDirection>(DEFAULT_VIEW);
  // dragStart pamti view u trenutku kad prevlacenje pocne -- gesture.dx/dy
  // su vec kumulativni od pocetka gesta, pa se pomjeraj racuna od ove fiksne
  // tacke (ne dodaje na trenutni view, sto bi duplo brojalo pomjeraj).
  const [dragStart, setDragStart] = useState<ViewDirection>(DEFAULT_VIEW);

  // Bez useRef/useMemo (React Compiler ne dozvoljava citanje ref-a unutar
  // callback-a proslijedjenih PanResponder.create) -- pravi se svjez svaki
  // render, jeftina operacija, hvata najnoviji view/dragStart iz closure-a.
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setDragStart(view);
    },
    onPanResponderMove: (_evt, gesture) => {
      const nextAzimuth = (dragStart.azimuth - gesture.dx * DEG_PER_PIXEL + 360) % 360;
      const nextAltitude = Math.max(-10, Math.min(85, dragStart.altitude + gesture.dy * DEG_PER_PIXEL));
      setView({ azimuth: nextAzimuth, altitude: nextAltitude });
    },
  });

  const half = MAP_SIZE / 2;

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
            const projected = projectToView(obj.azimuth, obj.altitude, view, FOV);
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
      </YStack>
      <Paragraph fontSize="$2" color="$color11" textAlign="center">
        {t('tonight.map.compassHint', { direction: azimuthToCompass(view.azimuth) })}
      </Paragraph>
    </YStack>
  );
}
