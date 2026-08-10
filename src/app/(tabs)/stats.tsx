import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paragraph, Spinner, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import {
  ensureSession,
  getLearnedCardCount,
  getQuizPoints,
  getQuizResultDates,
  getReviewLogDates,
  getTotalReviewCount,
} from '@/db';
import { computeStreak } from '@/lib/stats';

type Stats = {
  totalReviews: number;
  learnedCards: number;
  quizPoints: number;
  streak: number;
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSession();
        const [totalReviews, learnedCards, quizPoints, reviewDates, quizDates] = await Promise.all([
          getTotalReviewCount(userId),
          getLearnedCardCount(userId),
          getQuizPoints(userId),
          getReviewLogDates(userId),
          getQuizResultDates(userId),
        ]);
        // Jedinstven "niz" -- flashcards i kviz obje racunaju kao aktivnost dana.
        setStats({
          totalReviews,
          learnedCards,
          quizPoints,
          streak: computeStreak([...reviewDates, ...quizDates]),
        });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <ScreenBackdrop>
      <YStack f={1} gap="$3" pt="$8" px="$4">
        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {!stats && !error && <Spinner size="large" />}
        {stats && (
          <>
            <GlassCard>
              <Paragraph fontFamily="$heading" fontSize="$7" color="$blue10">
                {t('stats.totalReviews', { count: stats.totalReviews })}
              </Paragraph>
            </GlassCard>
            <GlassCard>
              <Paragraph fontFamily="$heading" fontSize="$7" color="$green10">
                {t('stats.learnedCards', { count: stats.learnedCards })}
              </Paragraph>
            </GlassCard>
            <GlassCard>
              <Paragraph fontFamily="$heading" fontSize="$7" color="$purple10">
                {t('stats.quizPoints', { count: stats.quizPoints })}
              </Paragraph>
            </GlassCard>
            <GlassCard>
              <Paragraph fontFamily="$heading" fontSize="$7" color="$color">
                {t('stats.streak', { count: stats.streak })}
              </Paragraph>
            </GlassCard>
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
