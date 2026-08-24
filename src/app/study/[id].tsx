import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { FLIP_HALFWAY_MS, FlipCard } from '@/components/FlipCard';
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
import { formatIntervalFromMs, previewIntervals, Rating, scheduleReview, State, type IntervalUnit } from '@/srs';
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

// Deck.category je slug bez postojeceg UI mapiranja -- kategorijski chip na
// prednjoj strani kartice koristi ovaj rjecnik i sakriva se za nepoznat slug
// (isto ponasanje kao "nema kategorije" iz specifikacije).
const CATEGORY_KEY: Record<string, string> = {
  basics: 'study.category.basics',
  'deep-space': 'study.category.deepSpace',
  planets: 'study.category.planets',
};

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { queue, index, isFlipped, start, flip, unflip, advanceIndex } = useStudySessionStore();
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);
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
    // Okreni nazad odmah (jos uvijek prikazuje UPRAVO OCIJENJENU karticu -- nije
    // spojler), a sljedecu karticu ucitaj tek kad flip animacija stigne na pola
    // okreta, gdje su obje strane kartice nevidljive (vidi FlipCard). Tako se
    // odgovor SLJEDECE kartice nikad ne vidi dok se prethodna jos vidljivo okrece.
    unflip();
    advanceTimeoutRef.current = setTimeout(() => {
      advanceIndex();
    }, FLIP_HALFWAY_MS);
  }

  function intervalLabel(ms: number): string {
    const { unit, value } = formatIntervalFromMs(ms);
    return t(INTERVAL_KEY[unit], { count: value });
  }

  const currentProgress = currentCard ? (progressByCardId.get(currentCard.id) ?? null) : null;
  const intervalPreview = currentCard ? previewIntervals(currentProgress) : null;
  const cardState: 'new' | 'learning' | 'review' = !currentProgress
    ? 'new'
    : currentProgress.state === State.Review
      ? 'review'
      : 'learning';
  const categoryKey = deck ? CATEGORY_KEY[deck.category] : undefined;
  const progressPct = queue.length > 0 ? ((index + 1) / queue.length) * 100 : 0;

  return (
    <ScreenBackdrop>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack f={1} pb={insets.bottom + 16}>
        {error && (
          <Paragraph color="$red10" px="$4" pt={insets.top + 16}>
            {error}
          </Paragraph>
        )}
        {loading && (
          <YStack f={1} ai="center" jc="center">
            <Spinner size="large" />
          </YStack>
        )}
        {!loading && !error && !currentCard && (
          <YStack f={1} ai="center" jc="center" gap="$5" px="$4">
            <Paragraph fontSize="$6" textAlign="center">
              {queue.length === 0 ? t('study.empty') : t('study.done')}
            </Paragraph>
            <YStack
              height={52}
              px="$6"
              borderRadius={999}
              backgroundColor={palette.nebula}
              ai="center"
              jc="center"
              onPress={() => router.back()}
              pressStyle={{ opacity: 0.85 }}>
              <Paragraph fontWeight="700" fontSize={15} color={palette.starlight}>
                {t('study.back')}
              </Paragraph>
            </YStack>
          </YStack>
        )}

        {currentCard && (
          <>
            <YStack pt={insets.top + 16} px="$4" pb="$3" gap="$3">
              <XStack ai="center" gap="$3">
                <Ionicons name="chevron-back" size={26} color={palette.starlight} onPress={() => router.back()} />
                <YStack f={1} gap={1}>
                  <Paragraph fontFamily="$heading" fontSize={15} fontWeight="600" color={palette.starlight} numberOfLines={1}>
                    {deck ? pickLocalized(deck.name, i18n.language) : ''}
                  </Paragraph>
                  <Paragraph fontSize={12} color={palette.haze}>
                    {t('study.cardOf', { current: index + 1, total: queue.length })}
                  </Paragraph>
                </YStack>
                <XStack
                  ai="center"
                  gap={5}
                  px={10}
                  py={5}
                  borderRadius={999}
                  overflow="hidden"
                  backgroundColor={cardState === 'new' ? 'rgba(51,214,176,0.14)' : 'rgba(124,108,255,0.18)'}
                  borderWidth={1}
                  borderColor={cardState === 'new' ? 'rgba(51,214,176,0.5)' : 'rgba(124,108,255,0.4)'}>
                  <Ionicons
                    name={cardState === 'new' ? 'sparkles' : 'time-outline'}
                    size={12}
                    color={cardState === 'new' ? palette.aurora : palette.nebula}
                  />
                  <Paragraph fontSize={11} fontWeight="600" color={cardState === 'new' ? palette.aurora : palette.nebula}>
                    {t(`study.cardState.${cardState}`)}
                  </Paragraph>
                </XStack>
              </XStack>
              <YStack height={6} borderRadius={999} backgroundColor="rgba(255,255,255,0.08)" overflow="hidden">
                <YStack
                  height={6}
                  width={`${progressPct}%`}
                  borderRadius={999}
                  backgroundColor={palette.nebula}
                />
              </YStack>
            </YStack>

            <YStack f={1} px="$4">
              <FlipCard
                flipped={isFlipped}
                onPress={flip}
                front={
                  <YStack f={1} width="100%" ai="center" jc="space-between">
                    {categoryKey ? (
                      <XStack
                        px={14}
                        py={6}
                        borderRadius={999}
                        backgroundColor="rgba(124,108,255,0.18)"
                        borderWidth={1}
                        borderColor="rgba(124,108,255,0.4)">
                        <Paragraph fontSize={11} fontWeight="600" letterSpacing={0.9} textTransform="uppercase" color="#C9C4EC">
                          {t(categoryKey)}
                        </Paragraph>
                      </XStack>
                    ) : (
                      <YStack />
                    )}

                    <YStack ai="center" gap="$4">
                      {currentCard.imageUrl && deck && !failedImageIds.has(currentCard.id) && (
                        <Image
                          source={{ uri: getCardImageUrl(deck.slug, currentCard.imageUrl) }}
                          style={{ width: 220, height: 220, borderRadius: 16 }}
                          contentFit="cover"
                          transition={300}
                          onError={() => setFailedImageIds((prev) => new Set(prev).add(currentCard.id))}
                        />
                      )}
                      <Paragraph fontFamily="$heading" fontSize={26} fontWeight="600" lineHeight={32} color={palette.starlight} textAlign="center">
                        {pickLocalized(currentCard.front, i18n.language)}
                      </Paragraph>
                    </YStack>

                    <XStack ai="center" gap={7} opacity={0.7}>
                      <Ionicons name="sync-outline" size={15} color={palette.haze} />
                      <Paragraph fontSize={12} color={palette.haze}>
                        {t('study.tapToFlip')}
                      </Paragraph>
                    </XStack>
                  </YStack>
                }
                back={
                  <YStack f={1} width="100%" ai="stretch" jc="flex-start" gap={16}>
                    <YStack gap={6} pb={16} borderBottomWidth={1} borderBottomColor="rgba(124,108,255,0.25)">
                      <Paragraph fontSize={11} fontWeight="600" letterSpacing={0.9} textTransform="uppercase" color={palette.haze}>
                        {t('study.question')}
                      </Paragraph>
                      <Paragraph fontSize={15} color="#C9C4EC">
                        {pickLocalized(currentCard.front, i18n.language)}
                      </Paragraph>
                    </YStack>
                    <YStack gap="$3">
                      <XStack ai="center" gap={8}>
                        <Ionicons name="checkmark-circle" size={20} color={palette.aurora} />
                        <Paragraph fontSize={11} fontWeight="600" letterSpacing={0.9} textTransform="uppercase" color={palette.aurora}>
                          {t('study.answer')}
                        </Paragraph>
                      </XStack>
                      <Paragraph fontFamily="$heading" fontSize={24} fontWeight="600" lineHeight={30} color={palette.starlight}>
                        {pickLocalized(currentCard.back, i18n.language)}
                      </Paragraph>
                      {currentCard.explanation && (
                        <Paragraph fontSize={14} lineHeight={22} color="#A5A5A5">
                          {pickLocalized(currentCard.explanation, i18n.language)}
                        </Paragraph>
                      )}
                    </YStack>
                  </YStack>
                }
              />
            </YStack>

            <YStack pt="$3" px="$4">
              {!isFlipped ? (
                <YStack
                  height={52}
                  borderRadius={999}
                  backgroundColor={palette.nebula}
                  ai="center"
                  jc="center"
                  onPress={flip}
                  pressStyle={{ opacity: 0.85 }}>
                  <XStack ai="center" gap={8}>
                    <Ionicons name="eye-outline" size={18} color={palette.starlight} />
                    <Paragraph fontWeight="700" fontSize={15} color={palette.starlight}>
                      {t('study.reveal')}
                    </Paragraph>
                  </XStack>
                </YStack>
              ) : (
                <YStack gap="$2">
                  <Paragraph fontSize={11} color={palette.haze} textAlign="center">
                    {t('study.ratingCaption')}
                  </Paragraph>
                  <XStack gap={9}>
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
                </YStack>
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
