import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Paragraph, YStack } from 'tamagui';

import { ConstellationView } from '@/components/ConstellationView';
import { pickLocalized } from '@/lib/localized';
import type { QuizQuestion } from '@/lib/quiz';
import { palette } from '@/theme/palette';

const UNANSWERED_TEXT = '#C9C4EC';

type QuizQuestionCardProps = {
  question: QuizQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  panelHeight?: number;
};

export function QuizQuestionCard({ question, selectedId, onSelect, panelHeight = 210 }: QuizQuestionCardProps) {
  const { t, i18n } = useTranslation();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = question.prompt.kind === 'image' && failedImageUrl === question.prompt.url;

  return (
    <>
      {/* "Sky" panel -- fiksne visine i overflow hidden, prompt vizual je
          namjerno manji (180px) da se sazvijezdje/planeta nikad ne rezu.
          LinearGradient je SAM kontejner (ne apsolutno pozicioniran sibling)
          -- na RN Web-u apsolutni sibling unutar YStack-a moze nepredvidljivo
          preklopiti kasniju "static" djecu jer RN Web skoro svemu dodaje
          position:relative, pa DOM-redoslijed sam po sebi ne garantuje sloj. */}
      <LinearGradient
        colors={['rgba(43,37,96,0.95)', 'rgba(13,11,33,0.95)']}
        style={{
          height: panelHeight,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(124,108,255,0.4)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Paragraph
          position="absolute"
          top={12}
          left={14}
          fontSize={11}
          letterSpacing={1.1}
          textTransform="uppercase"
          color={palette.haze}>
          {t('quiz.identify')}
        </Paragraph>

        {question.prompt.kind === 'shape' && (
          <ConstellationView stars={question.prompt.stars} lines={question.prompt.lines} size={180} glow />
        )}
        {question.prompt.kind === 'image' && !imageFailed && (
          <Image
            source={{ uri: question.prompt.url }}
            style={{
              width: 180,
              height: 180,
              borderRadius: 999,
              shadowColor: palette.nebula,
              shadowOpacity: 0.5,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
            contentFit="cover"
            transition={300}
            onError={() => setFailedImageUrl(question.prompt.kind === 'image' ? question.prompt.url : null)}
          />
        )}
        {question.prompt.kind === 'text' && (
          <Paragraph fontFamily="$heading" fontSize={19} fontWeight="700" textAlign="center" color={palette.starlight} px="$4">
            {pickLocalized(question.prompt.text, i18n.language)}
          </Paragraph>
        )}
      </LinearGradient>

      <YStack gap="$2">
        {question.options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const showResult = selectedId !== null;

          let color: string = palette.nebula;
          if (showResult && isCorrectOption) color = palette.aurora;
          else if (showResult && isSelected) color = palette.comet;

          const borderColor = showResult ? color : `${color}80`;
          const backgroundColor = showResult ? `${color}29` : `${color}1A`;
          const textColor = showResult ? color : UNANSWERED_TEXT;

          return (
            <Pressable key={option.id} disabled={selectedId !== null} onPress={() => onSelect(option.id)}>
              <YStack
                flexDirection="row"
                alignItems="center"
                gap={10}
                borderWidth={1}
                borderColor={borderColor}
                backgroundColor={backgroundColor}
                borderRadius={15}
                p={13}>
                {showResult && isCorrectOption && <Ionicons name="checkmark-circle" size={20} color={palette.aurora} />}
                {showResult && isSelected && !isCorrectOption && (
                  <Ionicons name="close-circle" size={20} color={palette.comet} />
                )}
                <Paragraph f={1} color={textColor} fontWeight="600" fontSize={14}>
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
