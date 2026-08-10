import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, H3, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import {
  ensureSession,
  getCardProgress,
  getCardProgressForCards,
  getCardsForDeck,
  insertReviewLog,
  upsertCardProgress,
} from '@/db';
import { pickLocalized } from '@/lib/localized';
import { Rating, scheduleReview } from '@/srs';
import { useStudySessionStore } from '@/store/studySession';

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const { queue, index, isFlipped, start, flip, advance } = useStudySessionStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const uid = await ensureSession();
        setUserId(uid);

        const cards = await getCardsForDeck(id);
        const progress = await getCardProgressForCards(
          uid,
          cards.map((card) => card.id),
        );
        const progressByCardId = new Map(progress.map((p) => [p.cardId, p]));
        const now = new Date();
        const due = cards.filter((card) => {
          const p = progressByCardId.get(card.id);
          return !p || new Date(p.due) <= now;
        });

        start(due);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, start]);

  const currentCard = queue[index];

  async function handleRate(rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy) {
    if (!userId || !currentCard) return;
    const existing = await getCardProgress(userId, currentCard.id);
    const { progress, reviewLog } = scheduleReview(existing, userId, currentCard.id, rating);
    await upsertCardProgress(progress);
    await insertReviewLog(reviewLog);
    advance();
  }

  return (
    <ScreenBackdrop>
      <YStack f={1} p="$4" jc="space-between">
        <Stack.Screen options={{ headerShown: true, title: '' }} />

        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {loading && <Spinner size="large" />}
        {!loading && !error && !currentCard && (
          <YStack f={1} ai="center" jc="center">
            <Paragraph fontSize="$6">{queue.length === 0 ? t('study.empty') : t('study.done')}</Paragraph>
          </YStack>
        )}

        {currentCard && (
          <>
            <GlassCard f={1} ai="center" jc="center" gap="$4" pressStyle={{ opacity: 0.9 }} onPress={flip}>
              <H3 textAlign="center">
                {isFlipped
                  ? pickLocalized(currentCard.back, i18n.language)
                  : pickLocalized(currentCard.front, i18n.language)}
              </H3>
              {isFlipped && currentCard.explanation && (
                <Paragraph color="$color11" textAlign="center">
                  {pickLocalized(currentCard.explanation, i18n.language)}
                </Paragraph>
              )}
            </GlassCard>

            {!isFlipped ? (
              <Button theme="blue" onPress={flip}>
                {t('study.reveal')}
              </Button>
            ) : (
              <XStack gap="$2">
                <Button f={1} theme="red" onPress={() => handleRate(Rating.Again)}>
                  {t('study.again')}
                </Button>
                <Button f={1} onPress={() => handleRate(Rating.Hard)}>
                  {t('study.hard')}
                </Button>
                <Button f={1} theme="blue" onPress={() => handleRate(Rating.Good)}>
                  {t('study.good')}
                </Button>
                <Button f={1} theme="green" onPress={() => handleRate(Rating.Easy)}>
                  {t('study.easy')}
                </Button>
              </XStack>
            )}
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
