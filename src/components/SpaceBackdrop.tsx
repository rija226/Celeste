import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { palette } from '@/theme/palette';

type Star = { left: DimensionValue; top: DimensionValue; size: number; opacity: number };

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function percent(value: number): DimensionValue {
  return `${value.toFixed(2)}%` as DimensionValue;
}

const STAR_COUNT = 70;
const random = seededRandom(42);
const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
  left: percent(random() * 100),
  top: percent(random() * 100),
  size: random() < 0.85 ? 1 : 2,
  opacity: 0.25 + random() * 0.55,
}));

// Dijeljena pozadina iza cijele app-a: svemirski gradijent + rasuti "zvjezdani"
// tackice. Renderuje se jednom u root layoutu; ekrani ostaju prozirni da se
// ovo vidi kroz njih (vidi CLAUDE.md: "tamna paleta, akcenti").
export function SpaceBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[palette.void, palette.nebulaDeep, palette.void]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {stars.map((star, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: star.size,
            backgroundColor: palette.starlight,
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}
