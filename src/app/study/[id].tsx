import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Button, H3, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { FlipCard } from '@/components/FlipCard';
import { RatingButton } from '@/components/RatingButton';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import {
  ensureSession,
  getCardImageUrl,
  getCardProgress,
  getCardProgressForCards,
  getCardsForDeck,
  getDeck,
  insertReviewLog,
  upsertCardProgress,
} from '@/db';
import { pickLocalized } from '@/lib/localized';
import { Rating, scheduleReview } from '@/srs';
import { useStudySessionStore } from '@/store/studySession';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const { queue, index, isFlipped, start, flip, advance } = useStudySessionStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const uid = await ensureSession();
        setUserId(uid);

        const [deckData, cards] = await Promise.all([getDeck(id), getCardsForDeck(id)]);
        setDeck(deckData);
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
            <YStack f={1}>
              <FlipCard
                flipped={isFlipped}
                onPress={flip}
                front={
                  <>
                    {currentCard.imageUrl && deck && !failedImageIds.has(currentCard.id) && (
                      <Image
                        source={{ uri: getCardImageUrl(deck.slug, currentCard.imageUrl) }}
                        style={{ width: 220, height: 220, borderRadius: 16 }}
                        contentFit="cover"
                        onError={() => setFailedImageIds((prev) => new Set(prev).add(currentCard.id))}
                      />
                    )}
                    <H3 textAlign="center">{pickLocalized(currentCard.front, i18n.language)}</H3>
                  </>
                }
                back={
                  <>
                    <H3 textAlign="center">{pickLocalized(currentCard.back, i18n.language)}</H3>
                    {currentCard.explanation && (
                      <Paragraph color="$color11" textAlign="center">
                        {pickLocalized(currentCard.explanation, i18n.language)}
                      </Paragraph>
                    )}
                  </>
                }
              />
            </YStack>

            {!isFlipped ? (
              <Button theme="blue" onPress={flip}>
                {t('study.reveal')}
              </Button>
            ) : (
              <XStack gap="$3">
                <RatingButton
                  icon="refresh"
                  label={t('study.again')}
                  color={palette.comet}
                  onPress={() => handleRate(Rating.Again)}
                />
                <RatingButton
                  icon="walk-outline"
                  label={t('study.hard')}
                  color={palette.haze}
                  onPress={() => handleRate(Rating.Hard)}
                />
                <RatingButton
                  icon="checkmark-circle-outline"
                  label={t('study.good')}
                  color={palette.nebula}
                  onPress={() => handleRate(Rating.Good)}
                />
                <RatingButton
                  icon="rocket-outline"
                  label={t('study.easy')}
                  color={palette.aurora}
                  onPress={() => handleRate(Rating.Easy)}
                />
              </XStack>
            )}
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
