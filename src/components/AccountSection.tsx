import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Paragraph, YStack } from 'tamagui';

import {
  ensureSession,
  getCurrentAuthUser,
  signInWithEmail,
  signOut,
  upgradeAnonymousAccount,
  type AuthUser,
} from '@/db';

type Mode = 'create' | 'login';

export function AccountSection() {
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  if (user && !user.isAnonymous) {
    return (
      <YStack gap="$2">
        <Paragraph color="$color11">{t('settings.account.title')}</Paragraph>
        <Paragraph fontFamily="$heading" color="$color">
          {t('settings.account.signedInAs', { email: user.email })}
        </Paragraph>
        <Button theme="red" disabled={submitting} onPress={handleSignOut}>
          {t('settings.account.signOut')}
        </Button>
      </YStack>
    );
  }

  if (confirmSentTo) {
    return (
      <YStack gap="$2">
        <Paragraph color="$color11">{t('settings.account.title')}</Paragraph>
        <Paragraph color="$green10">{t('settings.account.confirmEmailSent', { email: confirmSentTo })}</Paragraph>
      </YStack>
    );
  }

  return (
    <YStack gap="$2">
      <Paragraph color="$color11">{t('settings.account.title')}</Paragraph>
      <Paragraph color="$color11" fontSize="$2">
        {t('settings.account.guestLabel')}
      </Paragraph>

      <Input
        placeholder={t('settings.account.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        placeholder={t('settings.account.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {mode === 'create' && (
        <Input
          placeholder={t('settings.account.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}

      {mode === 'login' && (
        <Paragraph color="$color11" fontSize="$2">
          {t('settings.account.loginWarning')}
        </Paragraph>
      )}
      {error && <Paragraph color="$red10">{error}</Paragraph>}

      <Button
        theme="blue"
        disabled={submitting || !email || !password}
        onPress={mode === 'create' ? handleCreate : handleLogin}>
        {mode === 'create' ? t('settings.account.submitCreate') : t('settings.account.submitLogin')}
      </Button>

      <Paragraph
        color="$blue10"
        fontSize="$2"
        onPress={() => {
          setMode(mode === 'create' ? 'login' : 'create');
          setError(null);
        }}>
        {mode === 'create' ? t('settings.account.switchToLogin') : t('settings.account.switchToCreate')}
      </Paragraph>
    </YStack>
  );
}
