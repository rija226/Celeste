import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text } from 'react-native';
import { Input, Paragraph, XStack, YStack } from 'tamagui';

import { useReducedMotion } from '@/lib/motion';
import { PROFILE_GLYPHS, useProfileStore, type AccentName } from '@/store/profile';
import { ACCENT_COLORS, ACCENT_OPTIONS } from '@/theme/accent';
import { palette } from '@/theme/palette';

export function AvatarBuilderSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const storeGlyph = useProfileStore((s) => s.glyph);
  const storeAccent = useProfileStore((s) => s.accent);
  const storeName = useProfileStore((s) => s.name);
  const setGlyph = useProfileStore((s) => s.setGlyph);
  const setAccent = useProfileStore((s) => s.setAccent);
  const setName = useProfileStore((s) => s.setName);

  const [draftGlyph, setDraftGlyph] = useState(storeGlyph);
  const [draftAccent, setDraftAccent] = useState<AccentName>(storeAccent);
  const [draftName, setDraftName] = useState(storeName);

  // Draft resetuje na store vrijednosti svaki put kad se sheet otvori --
  // "adjusting state during render" umjesto setState u useEffect-u (izbjegava
  // kaskadni re-render), vidi https://react.dev/learn/you-might-not-need-an-effect
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraftGlyph(storeGlyph);
      setDraftAccent(storeAccent);
      setDraftName(storeName);
    }
  }

  const accentColor = ACCENT_COLORS[draftAccent];

  function handleSave() {
    setGlyph(draftGlyph);
    setAccent(draftAccent);
    setName(draftName.trim());
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,7,13,0.55)' }}
      />
      <YStack position="absolute" left={0} right={0} bottom={0}>
        <YStack
          position="relative"
          overflow="hidden"
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          borderTopWidth={1}
          borderColor="rgba(124,108,255,0.5)"
          pt={14}
          px={20}
          pb={40}
          gap={20}
          shadowColor="#000"
          shadowOpacity={0.5}
          shadowRadius={30}
          shadowOffset={{ width: 0, height: -10 }}>
          <LinearGradient
            colors={['#1a1636', '#0d0b21']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <YStack width={40} height={5} borderRadius={999} backgroundColor="rgba(241,239,251,0.25)" als="center" />

          <YStack ai="center" gap={10}>
            <YStack width={96} height={96}>
              <YStack
                position="absolute"
                width={96}
                height={96}
                borderRadius={999}
                backgroundColor={`${accentColor}55`}
              />
              <YStack
                position="absolute"
                top={4}
                left={4}
                width={88}
                height={88}
                borderRadius={999}
                backgroundColor="#120f2e"
                borderWidth={3}
                borderColor={accentColor}
                ai="center"
                jc="center">
                <Text style={{ fontSize: 48 }}>{draftGlyph}</Text>
              </YStack>
            </YStack>
            <Paragraph fontFamily="$heading" fontSize={18} fontWeight="600" color={palette.starlight}>
              {t('profile.editorTitle')}
            </Paragraph>
          </YStack>

          <YStack gap={10}>
            <Paragraph fontSize={12} color="$color11">
              {t('profile.displayName')}
            </Paragraph>
            <Input
              value={draftName}
              onChangeText={setDraftName}
              placeholder={t('profile.namePlaceholder')}
              backgroundColor="rgba(6,7,13,0.6)"
              borderColor={accentColor}
              borderWidth={1}
              borderRadius={12}
              height={46}
              fontSize={15}
              color={palette.starlight}
              placeholderTextColor={palette.haze}
            />
          </YStack>

          <YStack gap={10}>
            <Paragraph fontSize={12} color="$color11">
              {t('profile.glyph')}
            </Paragraph>
            <YStack gap={10}>
              {[0, 1].map((row) => (
                <XStack key={row} gap={10}>
                  {PROFILE_GLYPHS.slice(row * 4, row * 4 + 4).map((g) => {
                    const selected = g === draftGlyph;
                    return (
                      <YStack
                        key={g}
                        f={1}
                        aspectRatio={1}
                        borderRadius={16}
                        overflow="hidden"
                        ai="center"
                        jc="center"
                        backgroundColor={selected ? `${accentColor}40` : 'rgba(43,37,96,0.6)'}
                        borderWidth={selected ? 2 : 1}
                        borderColor={selected ? accentColor : 'rgba(124,108,255,0.3)'}
                        onPress={() => setDraftGlyph(g)}
                        pressStyle={{ opacity: 0.8 }}>
                        <Text style={{ fontSize: 30 }}>{g}</Text>
                      </YStack>
                    );
                  })}
                </XStack>
              ))}
            </YStack>
          </YStack>

          <YStack gap={10}>
            <Paragraph fontSize={12} color="$color11">
              {t('profile.accent')}
            </Paragraph>
            <XStack gap={14}>
              {ACCENT_OPTIONS.map((a) => {
                const selected = a === draftAccent;
                return (
                  <YStack
                    key={a}
                    width={52}
                    height={52}
                    borderRadius={999}
                    overflow="hidden"
                    ai="center"
                    jc="center"
                    backgroundColor={ACCENT_COLORS[a]}
                    borderWidth={3}
                    borderColor={selected ? palette.starlight : 'transparent'}
                    onPress={() => setDraftAccent(a)}
                    pressStyle={{ opacity: 0.8 }}>
                    {selected && <Ionicons name="checkmark" size={22} color={palette.void} />}
                  </YStack>
                );
              })}
            </XStack>
          </YStack>

          <XStack gap={12} mt={4}>
            <YStack
              f={1}
              height={50}
              borderRadius={999}
              borderWidth={1}
              borderColor="rgba(141,138,174,0.5)"
              ai="center"
              jc="center"
              onPress={onClose}
              pressStyle={{ opacity: 0.8 }}>
              <Paragraph fontWeight="600" fontSize={15} color="#C9C4EC">
                {t('profile.cancel')}
              </Paragraph>
            </YStack>
            <YStack
              f={2}
              height={50}
              borderRadius={999}
              backgroundColor={palette.nebula}
              ai="center"
              jc="center"
              onPress={handleSave}
              pressStyle={{ opacity: 0.85 }}>
              <Paragraph fontWeight="700" fontSize={15} color={palette.starlight}>
                {t('profile.save')}
              </Paragraph>
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
