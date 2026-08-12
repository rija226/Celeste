import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Paragraph, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import type { DailyActivity } from '@/lib/stats';
import { palette } from '@/theme/palette';

export function StreakHero({ streak, activity }: { streak: number; activity: DailyActivity[] }) {
  const { t } = useTranslation();

  return (
    <GlassCard ai="center" gap="$2" py="$5">
      {/* Obican RN Text, ne Tamagui Paragraph -- custom font (Inter) zna
          sprijeciti ispravan fallback na sistemski emoji font na Androidu. */}
      <Text style={{ fontSize: 40 }}>🔥</Text>
      {streak > 0 ? (
        <>
          <Paragraph fontFamily="$heading" fontSize="$10" color={palette.starlight} lineHeight="$10">
            {streak}
          </Paragraph>
          <Paragraph color="$color11">{t('stats.streakLabel', { count: streak })}</Paragraph>
        </>
      ) : (
        <Paragraph fontFamily="$heading" fontSize="$6" color="$color11" textAlign="center">
          {t('stats.streakEmpty')}
        </Paragraph>
      )}
      <XStack gap="$2" mt="$3">
        {activity.map((day) => {
          const active = day.reviews > 0 || day.quizAnswers > 0;
          return (
            <YStack
              key={day.dateKey}
              width={26}
              height={26}
              borderRadius={8}
              backgroundColor={active ? palette.aurora : palette.nebulaDeep}
              opacity={active ? 1 : 0.7}
            />
          );
        })}
      </XStack>
    </GlassCard>
  );
}
