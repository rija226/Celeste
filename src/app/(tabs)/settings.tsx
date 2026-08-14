import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, Paragraph, XStack, YStack } from 'tamagui';

import { AccountSection } from '@/components/AccountSection';
import { AvatarBuilderSheet } from '@/components/AvatarBuilderSheet';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { Toggle } from '@/components/Toggle';
import { ensureSession, getDecks, getQuizPoints, getQuizResultDates, getReviewLogDates, getTotalReviewCount } from '@/db';
import { changeLanguage } from '@/i18n';
import { computeStreak } from '@/lib/stats';
import { isDailyReminderEnabled, setDailyReminderEnabled } from '@/lib/notifications';
import { useSoundStore } from '@/store/sound';
import { palette } from '@/theme/palette';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hr', label: 'Hrvatski' },
] as const;

function SectionHeader({ label }: { label: string }) {
  return (
    <Paragraph fontSize={11} fontWeight="600" letterSpacing={1.1} textTransform="uppercase" color={palette.haze}>
      {label}
    </Paragraph>
  );
}

function SettingsGroup({ children }: { children: ReactNode }) {
  return (
    <YStack
      borderRadius={18}
      backgroundColor="rgba(43,37,96,0.7)"
      borderWidth={1}
      borderColor="rgba(124,108,255,0.4)"
      overflow="hidden">
      {children}
    </YStack>
  );
}

function GroupDivider() {
  return <YStack height={1} backgroundColor="rgba(124,108,255,0.2)" />;
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [profileStats, setProfileStats] = useState({ level: 1, streak: 0, unlockedLevels: 0, totalLevels: 0 });
  const sfxEnabled = useSoundStore((s) => s.sfxEnabled);
  const ambientEnabled = useSoundStore((s) => s.ambientEnabled);
  const setSfxEnabled = useSoundStore((s) => s.setSfxEnabled);
  const setAmbientEnabled = useSoundStore((s) => s.setAmbientEnabled);

  useEffect(() => {
    isDailyReminderEnabled().then(setReminderEnabled);
  }, []);

  useEffect(() => {
    (async () => {
      const userId = await ensureSession();
      const [totalReviews, quizPoints, reviewDates, quizDates, decks] = await Promise.all([
        getTotalReviewCount(userId),
        getQuizPoints(userId),
        getReviewLogDates(userId),
        getQuizResultDates(userId),
        getDecks(),
      ]);
      const totalXp = totalReviews + quizPoints;
      const leveledDecks = decks.filter((deck) => deck.level !== null).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
      const unlockedLevels = leveledDecks.filter((deck) => totalXp >= deck.xpRequired).length;
      const currentDeck = leveledDecks.find((deck) => totalXp < deck.xpRequired) ?? leveledDecks.at(-1) ?? null;
      const level = currentDeck ? leveledDecks.findIndex((deck) => deck.id === currentDeck.id) + 1 : 1;

      setProfileStats({
        level,
        streak: computeStreak([...reviewDates, ...quizDates]),
        unlockedLevels,
        totalLevels: leveledDecks.length,
      });
    })();
  }, []);

  async function handleToggleReminder(next: boolean) {
    const actual = await setDailyReminderEnabled(next, {
      title: t('notifications.reminderTitle'),
      body: t('notifications.reminderBody'),
    });
    setReminderEnabled(actual);
    setPermissionDenied(next && !actual && Platform.OS !== 'web');
  }

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} pt="$8" px="$4" pb="$8" gap={16}>
          <H2 color="$color">{t('settings.title')}</H2>

          <ProfileHeader
            level={profileStats.level}
            streak={profileStats.streak}
            unlockedLevels={profileStats.unlockedLevels}
            totalLevels={profileStats.totalLevels}
            onPress={() => setSheetVisible(true)}
          />

          <SectionHeader label={t('settings.sections.preferences')} />
          <SettingsGroup>
            <YStack gap={10} px={16} py={14}>
              <XStack ai="center" gap={10}>
                <Ionicons name="language" size={18} color={palette.nebula} />
                <Paragraph fontSize={14} color="$color">
                  {t('settings.language')}
                </Paragraph>
              </XStack>
              <XStack p={4} gap={4} borderRadius={12} backgroundColor="rgba(6,7,13,0.5)">
                {LANGUAGES.map(({ code, label }) => {
                  const active = i18n.language === code;
                  return (
                    <YStack
                      key={code}
                      f={1}
                      height={34}
                      borderRadius={9}
                      ai="center"
                      jc="center"
                      backgroundColor={active ? palette.nebula : 'transparent'}
                      onPress={() => changeLanguage(code)}
                      pressStyle={{ opacity: 0.8 }}>
                      <Paragraph
                        fontWeight={active ? '600' : '500'}
                        fontSize={13}
                        color={active ? palette.starlight : palette.haze}>
                        {label}
                      </Paragraph>
                    </YStack>
                  );
                })}
              </XStack>
            </YStack>
            <GroupDivider />
            <XStack ai="center" jc="space-between" px={16} py={14}>
              <YStack gap={2} f={1}>
                <XStack ai="center" gap={10}>
                  <Ionicons name="notifications" size={18} color={palette.nebula} />
                  <Paragraph fontSize={14} color="$color">
                    {t('settings.dailyReminder')}
                  </Paragraph>
                </XStack>
                {Platform.OS === 'web' ? (
                  <Paragraph fontSize={12} color={palette.haze} pl={28}>
                    {t('settings.dailyReminderWebNote')}
                  </Paragraph>
                ) : reminderEnabled ? (
                  <Paragraph fontSize={12} color={palette.haze} pl={28}>
                    {t('settings.dailyReminderTime')}
                  </Paragraph>
                ) : permissionDenied ? (
                  <Paragraph fontSize={12} color={palette.comet} pl={28}>
                    {t('settings.dailyReminderDeniedNote')}
                  </Paragraph>
                ) : null}
              </YStack>
              <Toggle value={reminderEnabled} disabled={Platform.OS === 'web'} onValueChange={handleToggleReminder} />
            </XStack>
          </SettingsGroup>

          <SectionHeader label={t('settings.sections.sound')} />
          <SettingsGroup>
            <XStack ai="center" jc="space-between" px={16} py={14}>
              <XStack ai="center" gap={10}>
                <Ionicons name="volume-high" size={18} color={palette.nebula} />
                <Paragraph fontSize={14} color="$color">
                  {t('settings.sound.sfx')}
                </Paragraph>
              </XStack>
              <Toggle value={sfxEnabled} onValueChange={setSfxEnabled} />
            </XStack>
            <GroupDivider />
            <XStack ai="center" jc="space-between" px={16} py={14}>
              <XStack ai="center" gap={10}>
                <Ionicons name="musical-notes" size={18} color={palette.nebula} />
                <Paragraph fontSize={14} color="$color">
                  {t('settings.sound.ambient')}
                </Paragraph>
              </XStack>
              <Toggle value={ambientEnabled} onValueChange={setAmbientEnabled} />
            </XStack>
          </SettingsGroup>

          <SectionHeader label={t('settings.sections.account')} />
          <SettingsGroup>
            <AccountSection />
          </SettingsGroup>
        </YStack>
      </ScrollView>

      <AvatarBuilderSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </ScreenBackdrop>
  );
}
