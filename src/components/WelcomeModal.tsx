import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Paragraph, XStack, YStack } from 'tamagui';

import { palette } from '@/theme/palette';

const FEATURES = [
  { icon: 'albums', accent: palette.nebula, titleKey: 'welcome.features.learnTitle', bodyKey: 'welcome.features.learnBody' },
  { icon: 'sparkles', accent: palette.aurora, titleKey: 'welcome.features.quizTitle', bodyKey: 'welcome.features.quizBody' },
  { icon: 'telescope', accent: palette.amber, titleKey: 'welcome.features.skyTitle', bodyKey: 'welcome.features.skyBody' },
] as const;

export function WelcomeModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <YStack f={1} ai="center" jc="center" p="$5" backgroundColor="rgba(6,7,13,0.82)">
        <YStack
          position="relative"
          overflow="hidden"
          width="100%"
          maxWidth={340}
          borderRadius={28}
          borderWidth={1}
          borderColor="rgba(124,108,255,0.5)"
          shadowColor={palette.nebula}
          shadowOpacity={0.35}
          shadowRadius={30}
          shadowOffset={{ width: 0, height: 12 }}
          pt={32}
          px={24}
          pb={24}
          ai="center"
          gap={18}>
          <LinearGradient
            colors={['rgba(43,37,96,0.96)', 'rgba(20,15,46,0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <YStack width={96} height={96}>
            <YStack
              position="absolute"
              width={96}
              height={96}
              borderRadius={999}
              backgroundColor="rgba(124,108,255,0.35)"
            />
            <YStack position="absolute" top={8} left={8} width={80} height={80} borderRadius={999} overflow="hidden">
              <LinearGradient
                colors={['#9E7BFF', '#5B49C8', '#2B2560']}
                start={{ x: 0.3, y: 0.2 }}
                end={{ x: 0.8, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 46 }}>🪐</Text>
              </LinearGradient>
            </YStack>
          </YStack>

          <YStack ai="center" gap={6}>
            <Paragraph fontFamily="$heading" fontSize={24} fontWeight="700" color={palette.starlight} textAlign="center">
              {t('welcome.title')}
            </Paragraph>
            <Paragraph fontSize={13} lineHeight={19.5} color="#A5A5A5" textAlign="center">
              {t('welcome.intro')}
            </Paragraph>
          </YStack>

          <YStack width="100%" gap={12}>
            {FEATURES.map((feature) => (
              <XStack key={feature.titleKey} ai="center" gap={13}>
                <YStack
                  width={44}
                  height={44}
                  borderRadius={14}
                  overflow="hidden"
                  ai="center"
                  jc="center"
                  backgroundColor={`${feature.accent}29`}
                  borderWidth={1}
                  borderColor={`${feature.accent}66`}>
                  <Ionicons name={feature.icon} size={21} color={feature.accent} />
                </YStack>
                <YStack f={1} gap={2}>
                  <Paragraph fontFamily="$heading" fontSize={14} fontWeight="600" color={palette.starlight}>
                    {t(feature.titleKey)}
                  </Paragraph>
                  <Paragraph fontSize={12} lineHeight={16.8} color="#A5A5A5">
                    {t(feature.bodyKey)}
                  </Paragraph>
                </YStack>
              </XStack>
            ))}
          </YStack>

          <YStack
            width="100%"
            height={52}
            mt={4}
            borderRadius={999}
            backgroundColor={palette.nebula}
            shadowColor={palette.nebula}
            shadowOpacity={0.4}
            shadowRadius={20}
            shadowOffset={{ width: 0, height: 8 }}
            ai="center"
            jc="center"
            onPress={onDismiss}
            pressStyle={{ opacity: 0.85 }}>
            <XStack ai="center" gap={8}>
              <Paragraph fontWeight="700" fontSize={15} color={palette.starlight}>
                {t('welcome.cta')}
              </Paragraph>
              <Ionicons name="arrow-forward" size={17} color={palette.starlight} />
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
