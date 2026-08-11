import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { AnimatePresence, Paragraph, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { useReducedMotion } from '@/lib/motion';
import { useCelebrationStore, type Celebration } from '@/store/celebration';

const AUTO_DISMISS_MS = 3500;

const SPARKLES = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2;
  return { dx: Math.cos(angle) * 60, dy: Math.sin(angle) * 30, delay: i * 40 };
});

function Sparkle({ dx, dy, delay }: { dx: number; dy: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSequence(withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 500 })),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    marginLeft: dx * progress.value - 6,
    marginTop: dy * progress.value - 6,
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.8 }],
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left: '50%', top: '50%', fontSize: 14 }, style]}>✨</Animated.Text>
  );
}

function messageFor(celebration: Celebration, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (celebration.kind === 'streak') return t('celebration.streak', { count: celebration.streakCount ?? 0 });
  if (celebration.kind === 'deckComplete') return t('celebration.deckComplete');
  return t('celebration.dailyGoal');
}

export function CelebrationToast() {
  const { t } = useTranslation();
  const active = useCelebrationStore((s) => s.queue[0] ?? null);
  const dismiss = useCelebrationStore((s) => s.dismiss);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [active, dismiss]);

  return (
    <YStack position="absolute" top={0} left={0} right={0} pt="$10" ai="center" pointerEvents="box-none" zIndex={1000}>
      <AnimatePresence>
        {active && (
          <YStack
            key="celebration"
            position="relative"
            animation={reducedMotion ? undefined : 'quick'}
            enterStyle={reducedMotion ? undefined : { opacity: 0, y: -16 }}
            exitStyle={reducedMotion ? undefined : { opacity: 0, y: -16 }}>
            <GlassCard px="$5" py="$4" onPress={dismiss} pressStyle={{ opacity: 0.85 }}>
              <Paragraph fontFamily="$heading" fontSize="$5" color="$color" textAlign="center">
                {messageFor(active, t)}
              </Paragraph>
            </GlassCard>
            {!reducedMotion && SPARKLES.map((s, i) => <Sparkle key={i} dx={s.dx} dy={s.dy} delay={s.delay} />)}
          </YStack>
        )}
      </AnimatePresence>
    </YStack>
  );
}
