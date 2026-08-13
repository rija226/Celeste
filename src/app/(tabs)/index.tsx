import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Paragraph, Spinner, YStack } from 'tamagui';

import { HomeHeader } from '@/components/HomeHeader';
import { LevelPath } from '@/components/LevelPath';
import { ResumeDock } from '@/components/ResumeDock';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import {
  ensureSession,
  getCardsForDeck,
  getDecks,
  getDueCount,
  getQuizPoints,
  getQuizResultDates,
  getReviewLogDates,
  getTotalReviewCount,
} from '@/db';
import { computeStreak } from '@/lib/stats';
import { palette } from '@/theme/palette';
import type { Deck } from '@/types/models';

const DOCK_SCRIM_HEIGHT = 130;

export default function HomeScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecks()
      .then(setDecks)
      .catch((e: Error) => setError(e.message));

    (async () => {
      try {
        const userId = await ensureSession();
        const [totalReviews, quizPoints, reviewDates, quizDates] = await Promise.all([
          getTotalReviewCount(userId),
          getQuizPoints(userId),
          getReviewLogDates(userId),
          getQuizResultDates(userId),
        ]);
        setTotalXp(totalReviews + quizPoints);
        setStreak(computeStreak([...reviewDates, ...quizDates]));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const sortedDecks = (decks ?? []).filter((deck) => deck.level !== null).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const currentDeck = totalXp === null ? null : (sortedDecks.find((deck) => totalXp < deck.xpRequired) ?? sortedDecks.at(-1) ?? null);
  const level = currentDeck ? sortedDecks.findIndex((deck) => deck.id === currentDeck.id) + 1 : 1;

  useEffect(() => {
    if (!currentDeck) return;
    (async () => {
      try {
        const userId = await ensureSession();
        const cards = await getCardsForDeck(currentDeck.id);
        setDueCount(await getDueCount(userId, cards.map((card) => card.id)));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    // currentDeck je izveden iznova svaki render -- namjerno pratimo samo
    // stabilan currentDeck?.id, ne cio objekat (isti obrazac kao u quiz.tsx).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeck?.id]);

  function goToCurrentDeck() {
    if (currentDeck) router.push(`/deck/${currentDeck.id}`);
  }

  const ready = decks && totalXp !== null && currentDeck;

  return (
    <ScreenBackdrop>
      <YStack f={1}>
        {error && (
          <Paragraph color="$red10" px="$4" pt="$8">
            {error}
          </Paragraph>
        )}

        {!ready && !error && (
          <YStack f={1} ai="center" jc="center">
            <Spinner size="large" />
          </YStack>
        )}

        {ready && (
          <>
            <HomeHeader level={level} totalXp={totalXp} xpRequired={currentDeck.xpRequired} streak={streak} />
            <LevelPath decks={decks} totalXp={totalXp} />
            <YStack pt={DOCK_SCRIM_HEIGHT} px="$3.5" pb="$3" position="relative">
              <LinearGradient
                colors={['transparent', palette.void]}
                locations={[0, 0.55]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <ResumeDock deck={currentDeck} totalXp={totalXp} xpRequired={currentDeck.xpRequired} dueCount={dueCount} onPress={goToCurrentDeck} />
            </YStack>
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
