import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { H2, Paragraph, Spinner, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { getDecks } from '@/db';
import { pickLocalized } from '@/lib/localized';
import type { Deck } from '@/types/models';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecks()
      .then(setDecks)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <YStack f={1} gap="$3" pt="$8" px="$4">
      <H2 color="$color">{t('home.title')}</H2>

      {error && <Paragraph color="$red10">{error}</Paragraph>}
      {!decks && !error && <Spinner size="large" />}

      {decks?.map((deck) => (
        <GlassCard key={deck.id} gap="$1" pressStyle={{ opacity: 0.8 }} onPress={() => router.push(`/deck/${deck.id}`)}>
          <Paragraph fontFamily="$heading" fontSize="$6" color="$color">
            {pickLocalized(deck.name, i18n.language)}
          </Paragraph>
          <Paragraph color="$color11" numberOfLines={2}>
            {pickLocalized(deck.description, i18n.language)}
          </Paragraph>
        </GlassCard>
      ))}
    </YStack>
  );
}
