import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const cardFaceStyle = {
  backgroundColor: 'rgba(43,37,96,0.9)',
  borderColor: 'rgba(124,108,255,0.5)',
  borderWidth: 1,
  borderRadius: 24,
  padding: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: 16,
};

type FlipCardProps = {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  onPress: () => void;
};

// 3D flip: dva lica kartice rotiraju se oko Y ose, backfaceVisibility 'hidden'
// sakriva naličje svakog lica dok prelazi kroz 90 stepeni -- klasicna
// reanimated tehnika, bez potrebe za dodatnim opacity krosfejdom.
export function FlipCard({ flipped, front, back, onPress }: FlipCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(flipped ? 1 : 0, { duration: 450 });
  }, [flipped, progress]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
  }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, cardFaceStyle, frontStyle]}>{front}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, cardFaceStyle, backStyle]}>{back}</Animated.View>
    </Pressable>
  );
}
