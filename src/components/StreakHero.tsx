import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Paragraph, XStack, YStack } from 'tamagui';

import type { DailyActivity } from '@/lib/stats';
import { palette } from '@/theme/palette';

const SUB_INK = '#C9C4EC';

export function StreakHero({ streak, activity }: { streak: number; activity: DailyActivity[] }) {
  const { t, i18n } = useTranslation();
  const weekdayFormatter = new Intl.DateTimeFormat(i18n.language === 'hr' ? 'hr-HR' : 'en-US', { weekday: 'short' });

  return (
    <YStack
      position="relative"
      overflow="hidden"
      borderRadius={22}
      px={18}
      py={22}
      borderWidth={1}
      borderColor="rgba(255,107,94,0.5)"
      shadowColor={palette.comet}
      shadowOpacity={0.22}
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 10 }}
      ai="center"
      gap={10}>
      <LinearGradient
        colors={['rgba(255,107,94,0.28)', 'rgba(43,37,96,0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Obican RN Text, ne Tamagui Paragraph -- custom font (Inter) zna
          sprijeciti ispravan fallback na sistemski emoji font na Androidu. */}
      {streak > 0 ? (
        <>
          <XStack ai="baseline" gap={10}>
            <Text style={{ fontSize: 40, lineHeight: 40 }}>🔥</Text>
            <Paragraph fontFamily="$heading" fontSize={52} fontWeight="700" lineHeight={52} color={palette.starlight}>
              {streak}
            </Paragraph>
          </XStack>
          <Paragraph fontSize={14} color={SUB_INK}>
            {t('stats.streakLabel', { count: streak })}
          </Paragraph>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 40, lineHeight: 40 }}>🔥</Text>
          <Paragraph fontFamily="$heading" fontSize="$6" color="$color11" textAlign="center">
            {t('stats.streakEmpty')}
          </Paragraph>
        </>
      )}

      <XStack gap={8} mt={6}>
        {activity.map((day, index) => {
          const active = day.reviews > 0 || day.quizAnswers > 0;
          const isToday = index === activity.length - 1;
          const letter = weekdayFormatter.format(new Date(`${day.dateKey}T00:00:00`)).charAt(0).toUpperCase();
          return (
            <YStack key={day.dateKey} ai="center" gap={5}>
              <YStack
                width={26}
                height={26}
                borderRadius={9}
                backgroundColor={active ? palette.aurora : palette.nebulaDeep}
                opacity={active ? 1 : 0.7}
                borderWidth={2}
                borderColor={isToday ? palette.starlight : 'transparent'}
              />
              <Paragraph fontSize={10} color={palette.haze}>
                {letter}
              </Paragraph>
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
