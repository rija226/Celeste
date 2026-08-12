import { useEffect, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, H3, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { FlipCard } from '@/components/FlipCard';
import { RatingButton } from '@/components/RatingButton';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import {
  ensureSession,
  getCardImageUrl,
  getCardProgressForCards,
  getCardsForDeck,
  getDeck,
  insertReviewLog,
  upsertCardProgress,
} from '@/db';
import { pickLocalized } from '@/lib/localized';
import { playSfx, useAmbientSound } from '@/lib/sound';
import { formatIntervalFromMs, previewIntervals, Rating, scheduleReview, type IntervalUnit } from '@/srs';
import { checkAndCelebrateStreak } from '@/lib/streakCelebration';
import { useStudySessionStore } from '@/store/studySession';
import { useCelebrationStore } from '@/store/celebration';
import { palette } from '@/theme/palette';
import type { CardProgress, Deck } from '@/types/models';

const INTERVAL_KEY: Record<IntervalUnit, string> = {
  minutes: 'study.intervalMinutes',
  hours: 'study.intervalHours',
  days: 'study.intervalDays',
  months: 'study.intervalMonths',
  years: 'study.intervalYears',
};

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { queue, index, isFlipped, start, flip, advance } = useStudySessionStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [progressByCardId, setProgressByCardId] = useState<Map<string, CardProgress>>(new Map());
  const hadNewCardsRef = useRef(false);
  const sessionCelebratedRef = useRef(false);

  useAmbientSound();

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
        const progressMap = new Map(progress.map((p) => [p.cardId, p]));
        setProgressByCardId(progressMap);
        hadNewCardsRef.current = cards.some((card) => !progressMap.has(card.id));
        const now = new Date();
        const due = cards.filter((card) => {
          const p = progressMap.get(card.id);
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

  useEffect(() => {
    if (sessionCelebratedRef.current) return;
    if (loading || !userId || queue.length === 0 || index < queue.length) return;
    sessionCelebratedRef.current = true;
    useCelebrationStore.getState().celebrate({ kind: hadNewCardsRef.current ? 'deckComplete' : 'dailyGoal' });
    checkAndCelebrateStreak(userId);
  }, [loading, userId, queue.length, index]);

  async function handleRate(rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy) {
    if (!userId || !currentCard) return;
    playSfx('ratingConfirm');
    const existing = progressByCardId.get(currentCard.id) ?? null;
    const { progress, reviewLog } = scheduleReview(existing, userId, currentCard.id, rating);
    await upsertCardProgress(progress);
    await insertReviewLog(reviewLog);
    advance();
  }

  function intervalLabel(ms: number): string {
    const { unit, value } = formatIntervalFromMs(ms);
    return t(INTERVAL_KEY[unit], { count: value });
  }

  const intervalPreview = currentCard ? previewIntervals(progressByCardId.get(currentCard.id) ?? null) : null;

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$4" px="$4" pb={insets.bottom + 16} jc="space-between">
        <Stack.Screen options={{ headerShown: true, title: '' }} />

        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {loading && <Spinner size="large" />}
        {!loading && !error && !currentCard && (
          <YStack f={1} ai="center" jc="center" gap="$5">
            <Paragraph fontSize="$6" textAlign="center">
              {queue.length === 0 ? t('study.empty') : t('study.done')}
            </Paragraph>
            <Button theme="blue" onPress={() => router.back()}>
              {t('study.back')}
            </Button>
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
                        transition={300}
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
                  interval={intervalPreview ? intervalLabel(intervalPreview[Rating.Again]) : undefined}
                  color={palette.comet}
                  onPress={() => handleRate(Rating.Again)}
                />
                <RatingButton
                  icon="walk-outline"
                  label={t('study.hard')}
                  interval={intervalPreview ? intervalLabel(intervalPreview[Rating.Hard]) : undefined}
                  color={palette.amber}
                  onPress={() => handleRate(Rating.Hard)}
                />
                <RatingButton
                  icon="checkmark-circle-outline"
                  label={t('study.good')}
                  interval={intervalPreview ? intervalLabel(intervalPreview[Rating.Good]) : undefined}
                  color={palette.nebula}
                  onPress={() => handleRate(Rating.Good)}
                />
                <RatingButton
                  icon="rocket-outline"
                  label={t('study.easy')}
                  interval={intervalPreview ? intervalLabel(intervalPreview[Rating.Easy]) : undefined}
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
