import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { ActivityChart } from '@/components/ActivityChart';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { StatTile } from '@/components/StatTile';
import { StreakHero } from '@/components/StreakHero';
import {
  ensureSession,
  getDecks,
  getLearnedCardCount,
  getQuizPoints,
  getQuizResultDates,
  getReviewLogDates,
  getTotalReviewCount,
} from '@/db';
import { buildDailyActivity, computeStreak, type DailyActivity } from '@/lib/stats';
import { palette } from '@/theme/palette';

type Stats = {
  totalReviews: number;
  learnedCards: number;
  quizPoints: number;
  unlockedLevels: number;
  totalLevels: number;
  streak: number;
  activity: DailyActivity[];
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSession();
        const [totalReviews, learnedCards, quizPoints, reviewDates, quizDates, decks] = await Promise.all([
          getTotalReviewCount(userId),
          getLearnedCardCount(userId),
          getQuizPoints(userId),
          getReviewLogDates(userId),
          getQuizResultDates(userId),
          getDecks(),
        ]);
        // Jedinstven "niz" -- flashcards i kviz obje racunaju kao aktivnost dana.
        const totalXp = totalReviews + quizPoints;
        const leveledDecks = decks.filter((deck) => deck.level !== null);
        const unlockedLevels = leveledDecks.filter((deck) => totalXp >= deck.xpRequired).length;

        setStats({
          totalReviews,
          learnedCards,
          quizPoints,
          unlockedLevels,
          totalLevels: leveledDecks.length,
          streak: computeStreak([...reviewDates, ...quizDates]),
          activity: buildDailyActivity(reviewDates, quizDates, 7),
        });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} gap="$3" pt="$8" px="$4" pb="$8">
          <H2 color="$color">{t('stats.title')}</H2>

          {error && <Paragraph color="$red10">{error}</Paragraph>}
          {!stats && !error && <Spinner size="large" />}

          {stats && (
            <>
              <StreakHero streak={stats.streak} activity={stats.activity} />

              <XStack gap="$3">
                <StatTile icon="repeat" value={stats.totalReviews} label={t('stats.totalReviews')} color="#4FA8FF" />
                <StatTile
                  icon="school"
                  value={stats.learnedCards}
                  label={t('stats.learnedCards')}
                  color={palette.aurora}
                />
              </XStack>
              <XStack gap="$3">
                <StatTile
                  icon="trophy"
                  value={stats.quizPoints}
                  label={t('stats.quizPoints')}
                  color={palette.nebula}
                />
                <StatTile
                  icon="rocket"
                  value={`${stats.unlockedLevels}/${stats.totalLevels}`}
                  label={t('stats.unlockedLevels')}
                  color={palette.comet}
                />
              </XStack>

              <ActivityChart activity={stats.activity} />
            </>
          )}
        </YStack>
      </ScrollView>
    </ScreenBackdrop>
  );
}
