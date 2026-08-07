import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Paragraph, Spinner, YStack } from 'tamagui';

import { ensureSession, getCardProgressForCards, getCardsForDeck, getDeck } from '@/db';
import { pickLocalized } from '@/lib/localized';
import type { Card, Deck } from '@/types/models';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSession();
        const [deckData, cardsData] = await Promise.all([getDeck(id), getCardsForDeck(id)]);
        const progress = await getCardProgressForCards(
          userId,
          cardsData.map((card) => card.id),
        );
        const progressByCardId = new Map(progress.map((p) => [p.cardId, p]));
        const now = new Date();
        const due = cardsData.filter((card) => {
          const p = progressByCardId.get(card.id);
          return !p || new Date(p.due) <= now;
        });

        setDeck(deckData);
        setCards(cardsData);
        setDueCount(due.length);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id]);

  return (
    <YStack f={1} bg="$background" pt="$8" px="$4" gap="$3">
      <Stack.Screen options={{ headerShown: true, title: deck ? pickLocalized(deck.name, i18n.language) : '' }} />

      {error && <Paragraph color="$red10">{error}</Paragraph>}
      {!deck && !error && <Spinner size="large" />}

      {deck && (
        <>
          <Paragraph color="$color11">{pickLocalized(deck.description, i18n.language)}</Paragraph>
          <Paragraph>{t('deck.cardCount', { count: cards?.length ?? 0 })}</Paragraph>
          <Paragraph>{t('deck.dueCount', { count: dueCount })}</Paragraph>
          <Button
            theme="blue"
            disabled={dueCount === 0}
            onPress={() => router.push(`/study/${id}`)}>
            {t('deck.start')}
          </Button>
        </>
      )}
    </YStack>
  );
}
