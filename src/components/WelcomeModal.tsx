import { Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';

export function WelcomeModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <YStack f={1} ai="center" jc="center" p="$5" backgroundColor="rgba(6,7,13,0.85)">
        <GlassCard gap="$3" maxWidth={420}>
          <H2 fontFamily="$heading" color="$color" textAlign="center">
            {t('welcome.title')}
          </H2>
          <Paragraph color="$color11" textAlign="center">
            {t('welcome.body')}
          </Paragraph>
          <Button theme="blue" onPress={onDismiss}>
            {t('welcome.cta')}
          </Button>
        </GlassCard>
      </YStack>
    </Modal>
  );
}
