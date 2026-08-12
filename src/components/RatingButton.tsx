import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { Paragraph, YStack } from 'tamagui';

type RatingButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  interval?: string;
  color: string;
  onPress: () => void;
};

export function RatingButton({ icon, label, interval, color, onPress }: RatingButtonProps) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <YStack
          ai="center"
          jc="center"
          gap="$1.5"
          py="$3"
          borderRadius="$8"
          borderWidth={1}
          borderColor={color}
          backgroundColor={`${color}26`}
          opacity={pressed ? 0.7 : 1}>
          <Ionicons name={icon} size={20} color={color} />
          <Paragraph fontSize="$2" color={color} fontWeight="600">
            {label}
          </Paragraph>
          {interval && (
            <Paragraph fontSize="$1" color={color} opacity={0.75}>
              {interval}
            </Paragraph>
          )}
        </YStack>
      )}
    </Pressable>
  );
}
