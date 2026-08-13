import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Paragraph, Spinner, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { ensureSession, getCardsForDeck, getDeck, getDueCount } from '@/db';
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
        const due = await getDueCount(
          userId,
          cardsData.map((card) => card.id),
        );

        setDeck(deckData);
        setCards(cardsData);
        setDueCount(due);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id]);

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$8" px="$4" gap="$4">
        <Stack.Screen options={{ headerShown: true, title: deck ? pickLocalized(deck.name, i18n.language) : '' }} />

        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {!deck && !error && <Spinner size="large" />}

        {deck && (
          <>
            <GlassCard gap="$2">
              <Paragraph color="$color11">{pickLocalized(deck.description, i18n.language)}</Paragraph>
              <Paragraph fontFamily="$heading" fontSize="$5" color="$color">
                {t('deck.cardCount', { count: cards?.length ?? 0 })}
              </Paragraph>
              <Paragraph fontFamily="$heading" fontSize="$5" color="$blue10">
                {t('deck.dueCount', { count: dueCount })}
              </Paragraph>
            </GlassCard>
            <Button size="$5" theme="blue" disabled={dueCount === 0} onPress={() => router.push(`/study/${id}`)}>
              {t('deck.start')}
            </Button>
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
