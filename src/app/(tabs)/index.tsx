import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { H2, Paragraph, Spinner, YStack } from 'tamagui';

import { LevelPath } from '@/components/LevelPath';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { ensureSession, getDecks, getQuizPoints, getTotalReviewCount } from '@/db';
import type { Deck } from '@/types/models';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecks()
      .then(setDecks)
      .catch((e: Error) => setError(e.message));

    (async () => {
      try {
        const userId = await ensureSession();
        const [totalReviews, quizPoints] = await Promise.all([getTotalReviewCount(userId), getQuizPoints(userId)]);
        setTotalXp(totalReviews + quizPoints);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <ScreenBackdrop>
      <YStack f={1} gap="$3" pt="$8">
        <H2 color="$color" px="$4">
          {t('home.title')}
        </H2>

        {error && (
          <Paragraph color="$red10" px="$4">
            {error}
          </Paragraph>
        )}

        {(!decks || totalXp === null) && !error && <Spinner size="large" />}

        {decks && totalXp !== null && <LevelPath decks={decks} totalXp={totalXp} />}
      </YStack>
    </ScreenBackdrop>
  );
}
