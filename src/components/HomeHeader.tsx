import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Paragraph, XStack, YStack } from 'tamagui';

import { XpRing } from '@/components/XpRing';
import { getGreetingKey } from '@/lib/greeting';
import { palette } from '@/theme/palette';

const RING_SIZE = 60;
const RING_STROKE = 4;
const RING_TRACK = 'rgba(255,255,255,0.08)';
const RING_INNER_BG = '#120f2e';

type HomeHeaderProps = {
  level: number;
  totalXp: number;
  xpRequired: number;
  streak: number;
};

export function HomeHeader({ level, totalXp, xpRequired, streak }: HomeHeaderProps) {
  const { t } = useTranslation();
  const fraction = xpRequired > 0 ? totalXp / xpRequired : 1;
  const xpToNext = Math.max(0, xpRequired - totalXp);
  const greetingKey = getGreetingKey();

  return (
    <XStack px="$4" pt="$8" gap="$3" ai="center">
      <YStack width={RING_SIZE} height={RING_SIZE} ai="center" jc="center">
        <YStack position="absolute" width={RING_SIZE} height={RING_SIZE}>
          <XpRing size={RING_SIZE} strokeWidth={RING_STROKE} fraction={fraction} color={palette.amber} trackColor={RING_TRACK} />
        </YStack>
        <YStack
          width={RING_SIZE - RING_STROKE * 2}
          height={RING_SIZE - RING_STROKE * 2}
          borderRadius={999}
          backgroundColor={RING_INNER_BG}
          ai="center"
          jc="center">
          <Paragraph fontFamily="$heading" fontSize={20} fontWeight="700" color={palette.amber}>
            {t('home.levelBadge', { level })}
          </Paragraph>
        </YStack>
      </YStack>

      <YStack f={1} gap="$1">
        <Paragraph fontSize={12} fontWeight="500" letterSpacing={0.6} textTransform="uppercase" color={palette.haze}>
          {t('home.levelProgress', { level, xp: xpToNext })}
        </Paragraph>
        <Paragraph fontFamily="$heading" fontSize={24} fontWeight="700" color={palette.starlight}>
          {t(`home.greeting.${greetingKey}`)}
        </Paragraph>
      </YStack>

      <XStack
        ai="center"
        gap="$1.5"
        px="$3"
        py="$2"
        borderRadius={999}
        backgroundColor="rgba(255,107,94,0.14)"
        borderWidth={1}
        borderColor="rgba(255,107,94,0.55)">
        <Ionicons name="flame" size={16} color={palette.comet} />
        <Paragraph fontFamily="$heading" fontSize={16} fontWeight="700" color={palette.comet}>
          {streak}
        </Paragraph>
      </XStack>
    </XStack>
  );
}
