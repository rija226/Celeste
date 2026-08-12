import { useState } from 'react';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { ConstellationView } from '@/components/ConstellationView';
import { GlassCard } from '@/components/GlassCard';
import { pickLocalized } from '@/lib/localized';
import type { QuizQuestion } from '@/lib/quiz';
import { palette } from '@/theme/palette';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
};

export function QuizQuestionCard({ question, selectedId, onSelect }: QuizQuestionCardProps) {
  const { i18n } = useTranslation();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = question.prompt.kind === 'image' && failedImageUrl === question.prompt.url;

  return (
    <>
      <GlassCard ai="center" jc="center" py="$5">
        {question.prompt.kind === 'shape' && (
          <ConstellationView stars={question.prompt.stars} lines={question.prompt.lines} />
        )}
        {question.prompt.kind === 'image' && !imageFailed && (
          <Image
            source={{ uri: question.prompt.url }}
            style={{ width: 220, height: 220, borderRadius: 16 }}
            contentFit="cover"
            transition={300}
            onError={() => setFailedImageUrl(question.prompt.kind === 'image' ? question.prompt.url : null)}
          />
        )}
        {question.prompt.kind === 'text' && (
          <Paragraph fontFamily="$heading" fontSize="$6" textAlign="center" color="$color">
            {pickLocalized(question.prompt.text, i18n.language)}
          </Paragraph>
        )}
      </GlassCard>

      <YStack gap="$2">
        {question.options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const showResult = selectedId !== null;

          let color: string = palette.nebula;
          if (showResult && isCorrectOption) color = palette.aurora;
          else if (showResult && isSelected) color = palette.comet;

          return (
            <Pressable key={option.id} disabled={selectedId !== null} onPress={() => onSelect(option.id)}>
              <YStack borderWidth={1} borderColor={color} backgroundColor={`${color}26`} borderRadius="$6" p="$3">
                <Paragraph color={color} fontWeight="600">
                  {pickLocalized(option.label, i18n.language)}
                </Paragraph>
              </YStack>
            </Pressable>
          );
        })}
      </YStack>
    </>
  );
}
