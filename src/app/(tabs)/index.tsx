import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, YStack } from 'tamagui';

import { getDecks } from '@/db';
import { changeLanguage } from '@/i18n';
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
    <YStack f={1} gap="$3" bg="$background" pt="$8" px="$4">
      <H2 color="$color">{t('home.title')}</H2>
      <Button size="$3" alignSelf="flex-start" onPress={() => changeLanguage(i18n.language === 'en' ? 'hr' : 'en')}>
        {t('common.switchLanguage')}
      </Button>

      {error && <Paragraph color="$red10">{error}</Paragraph>}
      {!decks && !error && <Spinner size="large" />}

      {decks?.map((deck) => (
        <Button
          key={deck.id}
          justifyContent="flex-start"
          onPress={() => router.push(`/deck/${deck.id}`)}>
          {pickLocalized(deck.name, i18n.language)}
        </Button>
      ))}
    </YStack>
  );
}
