import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, YStack } from 'tamagui';

import { ConstellationView } from '@/components/ConstellationView';
import { GlassCard } from '@/components/GlassCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { getConstellations } from '@/db';
import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Constellation } from '@/types/models';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Question = { answer: Constellation; options: Constellation[] };

function pickQuestion(pool: Constellation[]): Question {
  const [answer, ...rest] = shuffle(pool);
  const wrongOptions = shuffle(rest).slice(0, 3);
  return { answer, options: shuffle([answer, ...wrongOptions]) };
}

export default function QuizScreen() {
  const { t, i18n } = useTranslation();
  const [pool, setPool] = useState<Constellation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    getConstellations()
      .then((data) => {
        setPool(data);
        setQuestion(pickQuestion(data));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  function handleSelect(option: Constellation) {
    if (!question || selectedId) return;
    setSelectedId(option.id);
    const isCorrect = option.id === question.answer.id;
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }

  function handleNext() {
    if (!pool) return;
    setSelectedId(null);
    setQuestion(pickQuestion(pool));
  }

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$8" px="$4" gap="$4">
        <YStack fd="row" ai="center" jc="space-between">
          <H2 color="$color">{t('quiz.title')}</H2>
          {pool && (
            <Paragraph fontFamily="$heading" fontSize="$6" color="$blue10">
              {score.correct}/{score.total}
            </Paragraph>
          )}
        </YStack>

        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {!question && !error && <Spinner size="large" />}

        {question && (
          <>
            <Paragraph color="$color11">{t('quiz.prompt')}</Paragraph>

            <GlassCard ai="center" jc="center" py="$5">
              <ConstellationView stars={question.answer.stars} lines={question.answer.lines} />
            </GlassCard>

            <YStack gap="$2">
              {question.options.map((option) => {
                const isSelected = selectedId === option.id;
                const isCorrectOption = option.id === question.answer.id;
                const showResult = selectedId !== null;

                let color: string = palette.nebula;
                if (showResult && isCorrectOption) color = palette.aurora;
                else if (showResult && isSelected) color = palette.comet;

                return (
                  <Pressable key={option.id} disabled={selectedId !== null} onPress={() => handleSelect(option)}>
                    <YStack
                      borderWidth={1}
                      borderColor={color}
                      backgroundColor={`${color}26`}
                      borderRadius="$6"
                      p="$3">
                      <Paragraph color={color} fontWeight="600">
                        {pickLocalized(option.name, i18n.language)}
                      </Paragraph>
                    </YStack>
                  </Pressable>
                );
              })}
            </YStack>

            {selectedId && (
              <>
                <Paragraph color="$color11">{pickLocalized(question.answer.facts, i18n.language)}</Paragraph>
                <Button theme="blue" onPress={handleNext}>
                  {t('quiz.next')}
                </Button>
              </>
            )}
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}
