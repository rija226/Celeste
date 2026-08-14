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
          gap={5}
          py={12}
          borderRadius={20}
          borderWidth={1}
          borderColor={color}
          backgroundColor={`${color}26`}
          opacity={pressed ? 0.7 : 1}>
          <Ionicons name={icon} size={20} color={color} />
          <Paragraph fontSize={12} color={color} fontWeight="600">
            {label}
          </Paragraph>
          {interval && (
            <Paragraph fontSize={10} color={color} opacity={0.8}>
              {interval}
            </Paragraph>
          )}
        </YStack>
      )}
    </Pressable>
  );
}
