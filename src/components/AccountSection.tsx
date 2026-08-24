import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Paragraph, XStack, YStack } from 'tamagui';

import {
  ensureSession,
  getCurrentAuthUser,
  signInWithEmail,
  signOut,
  upgradeAnonymousAccount,
  type AuthUser,
} from '@/db';
import { palette } from '@/theme/palette';

type Mode = 'create' | 'login';

export function AccountSection() {
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setUser(await getCurrentAuthUser());
    })();
  }, []);

  async function handleCreate() {
    setError(null);
    if (password.length < 6) {
      setError(t('settings.account.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('settings.account.passwordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await upgradeAnonymousAccount(email, password);
      setConfirmSentTo(email);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      setUser(await getCurrentAuthUser());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setSubmitting(true);
    await signOut();
    await ensureSession();
    setUser(await getCurrentAuthUser());
    setSubmitting(false);
  }

  if (user === undefined) {
    return null;
  }

  const inputProps = {
    backgroundColor: '#151517',
    borderColor: '#2A2A2E',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    fontSize: 14,
    color: palette.starlight,
    placeholderTextColor: palette.haze,
  } as const;

  if (user && !user.isAnonymous) {
    return (
      <YStack gap={10} p={16}>
        <Paragraph fontFamily="$heading" color="$color">
          {t('settings.account.signedInAs', { email: user.email })}
        </Paragraph>
        <YStack
          height={46}
          borderRadius={10}
          backgroundColor="rgba(255,107,94,0.15)"
          borderWidth={1}
          borderColor={palette.comet}
          ai="center"
          jc="center"
          opacity={submitting ? 0.6 : 1}
          onPress={submitting ? undefined : handleSignOut}
          pressStyle={{ opacity: 0.8 }}>
          <Paragraph fontWeight="600" fontSize={14} color={palette.comet}>
            {t('settings.account.signOut')}
          </Paragraph>
        </YStack>
      </YStack>
    );
  }

  if (confirmSentTo) {
    return (
      <YStack gap={10} p={16}>
        <Paragraph color={palette.aurora}>{t('settings.account.confirmEmailSent', { email: confirmSentTo })}</Paragraph>
      </YStack>
    );
  }

  return (
    <YStack gap={10} p={16}>
      <XStack ai="center" gap={8}>
        <Ionicons name="person-circle-outline" size={18} color={palette.haze} />
        <Paragraph color="$color11" fontSize={13} f={1}>
          {t('settings.account.guestLabel')}
        </Paragraph>
      </XStack>

      <Input
        placeholder={t('settings.account.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        {...inputProps}
      />
      <YStack position="relative">
        <Input
          placeholder={t('settings.account.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          pr={44}
          {...inputProps}
        />
        <YStack
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          width={44}
          ai="center"
          jc="center"
          onPress={() => setShowPassword((v) => !v)}
          pressStyle={{ opacity: 0.7 }}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.haze} />
        </YStack>
      </YStack>
      {mode === 'create' && (
        <YStack position="relative">
          <Input
            placeholder={t('settings.account.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            pr={44}
            {...inputProps}
          />
          <YStack
            position="absolute"
            right={0}
            top={0}
            bottom={0}
            width={44}
            ai="center"
            jc="center"
            onPress={() => setShowConfirmPassword((v) => !v)}
            pressStyle={{ opacity: 0.7 }}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.haze} />
          </YStack>
        </YStack>
      )}

      {mode === 'login' && (
        <Paragraph color="$color11" fontSize="$2">
          {t('settings.account.loginWarning')}
        </Paragraph>
      )}
      {error && <Paragraph color={palette.comet}>{error}</Paragraph>}

      <YStack
        height={46}
        borderRadius={10}
        backgroundColor={palette.nebula}
        ai="center"
        jc="center"
        opacity={submitting || !email || !password ? 0.5 : 1}
        onPress={submitting || !email || !password ? undefined : mode === 'create' ? handleCreate : handleLogin}
        pressStyle={{ opacity: 0.85 }}>
        <Paragraph fontWeight="600" fontSize={14} color={palette.starlight}>
          {mode === 'create' ? t('settings.account.submitCreate') : t('settings.account.submitLogin')}
        </Paragraph>
      </YStack>

      <Paragraph
        color="#52A9FF"
        fontSize={13}
        textAlign="center"
        onPress={() => {
          setMode(mode === 'create' ? 'login' : 'create');
          setError(null);
        }}>
        {mode === 'create' ? t('settings.account.switchToLogin') : t('settings.account.switchToCreate')}
      </Paragraph>
    </YStack>
  );
}
