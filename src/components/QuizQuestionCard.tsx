import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { ConstellationView } from '@/components/ConstellationView';
import { GlassCard } from '@/components/GlassCard';
import { pickLocalized } from '@/lib/localized';
import type { QuizQuestion } from '@/lib/quiz';
import { palette } from '@/theme/palette';
import type { Constellation } from '@/types/models';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selectedId: string | null;
  onSelect: (option: Constellation) => void;
};

export function QuizQuestionCard({ question, selectedId, onSelect }: QuizQuestionCardProps) {
  const { i18n } = useTranslation();

  return (
    <>
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
            <Pressable key={option.id} disabled={selectedId !== null} onPress={() => onSelect(option)}>
              <YStack borderWidth={1} borderColor={color} backgroundColor={`${color}26`} borderRadius="$6" p="$3">
                <Paragraph color={color} fontWeight="600">
                  {pickLocalized(option.name, i18n.language)}
                </Paragraph>
              </YStack>
            </Pressable>
          );
        })}
      </YStack>
    </>
  );
}
