import { useEffect } from 'react';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Line } from 'react-native-svg';

import { playSfx } from '@/lib/sound';
import { palette } from '@/theme/palette';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const FLIGHT_DURATION = 900;
const FLASH_IN_DURATION = 150;
const FLASH_OUT_DURATION = 450;

type Point = { x: number; y: number };

// Dijeljene animirane vrijednosti za let rakete od jednog cvora do drugog:
// progress prati letenje 0->1, flash kratko sine 0->1->0 kad raketa stigne.
export function useUnlockFlight(active: boolean, reducedMotion: boolean, onComplete: () => void) {
  const progress = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    playSfx('rocketLaunch');
    const flightDuration = reducedMotion ? 0 : FLIGHT_DURATION;
    progress.value = withTiming(1, { duration: flightDuration, easing: Easing.out(Easing.quad) });
    flash.value = withDelay(
      flightDuration,
      withSequence(
        withTiming(1, { duration: reducedMotion ? 0 : FLASH_IN_DURATION }),
        withTiming(0, { duration: reducedMotion ? 0 : FLASH_OUT_DURATION }, (finished) => {
          if (finished) runOnJS(onComplete)();
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- namjerno se pokrece samo kad active postane true
  }, [active]);

  return { progress, flash };
}

export function RocketFlightLine({
  from,
  to,
  progress,
}: {
  from: Point;
  to: Point;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeOpacity: 0.6 + progress.value * 0.3,
    stroke: interpolateColor(progress.value, [0, 1], [palette.nebulaDeep, palette.aurora]),
  }));

  return (
    <AnimatedLine
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      strokeWidth={5}
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
}

export function RocketFlightSprite({
  from,
  to,
  progress,
  flash,
}: {
  from: Point;
  to: Point;
  progress: SharedValue<number>;
  flash: SharedValue<number>;
}) {
  const rocketStyle = useAnimatedStyle(() => {
    const x = from.x + (to.x - from.x) * progress.value;
    const yLinear = from.y + (to.y - from.y) * progress.value;
    const arc = -36 * Math.sin(Math.PI * progress.value);
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
    return {
      left: x - 16,
      top: yLinear + arc - 16,
      transform: [{ rotate: `${angle}deg` }],
      opacity: 1 - flash.value * 0.5,
    };
  });

  const flashStyle = useAnimatedStyle(() => ({
    left: to.x - 50,
    top: to.y - 50,
    opacity: flash.value * 0.85,
    transform: [{ scale: 0.5 + flash.value * 0.9 }],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 32, height: 32 }, rocketStyle]}>
        <Animated.Text style={{ fontSize: 30 }}>🚀</Animated.Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: palette.starlight },
          flashStyle,
        ]}
      />
    </>
  );
}
