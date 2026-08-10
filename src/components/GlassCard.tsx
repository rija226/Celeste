import { YStack, type YStackProps } from 'tamagui';

// surface (svjetlije od pozadinskog gradijenta) + nebula ivica -- kartica
// treba jasno da se odvoji od void/nebulaDeep pozadine iza nje.
export function GlassCard(props: YStackProps) {
  return (
    <YStack
      backgroundColor="rgba(43,37,96,0.9)"
      borderColor="rgba(124,108,255,0.5)"
      borderWidth={1}
      borderRadius="$6"
      p="$4"
      shadowColor="#7C6CFF"
      shadowOpacity={0.25}
      shadowRadius={16}
      shadowOffset={{ width: 0, height: 6 }}
      {...props}
    />
  );
}
