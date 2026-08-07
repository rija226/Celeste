import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paragraph, Spinner, YStack } from 'tamagui';

import { ensureSession, getLearnedCardCount, getReviewLogDates, getTotalReviewCount } from '@/db';
import { computeStreak } from '@/lib/stats';

type Stats = {
  totalReviews: number;
  learnedCards: number;
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
        const [totalReviews, learnedCards, reviewDates] = await Promise.all([
          getTotalReviewCount(userId),
          getLearnedCardCount(userId),
          getReviewLogDates(userId),
        ]);
        setStats({ totalReviews, learnedCards, streak: computeStreak(reviewDates) });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <YStack f={1} ai="center" jc="center" gap="$3" bg="$background">
      {error && <Paragraph color="$red10">{error}</Paragraph>}
      {!stats && !error && <Spinner size="large" />}
      {stats && (
        <>
          <Paragraph fontSize="$6">{t('stats.totalReviews', { count: stats.totalReviews })}</Paragraph>
          <Paragraph fontSize="$6">{t('stats.learnedCards', { count: stats.learnedCards })}</Paragraph>
          <Paragraph fontSize="$6">{t('stats.streak', { count: stats.streak })}</Paragraph>
        </>
      )}
    </YStack>
  );
}
